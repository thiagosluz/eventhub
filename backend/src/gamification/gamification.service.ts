import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

interface CachedConfig {
  dailyXpLimit: number;
  levelFormulaBase: number;
  levelFormulaExponent: number;
  spikeThreshold: number;
  spikeWindowMinutes: number;
}

interface CachedAction {
  actionKey: string;
  xpAmount: number;
  isActive: boolean;
}

@Injectable()
export class GamificationService implements OnModuleInit {
  private configCache: CachedConfig | null = null;
  private actionsCache: Map<string, CachedAction> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadConfig();
  }

  async loadConfig() {
    try {
      const prisma = this.prisma as any;

      if (prisma.gamificationConfig) {
        const config = await prisma.gamificationConfig.findFirst();
        if (config) {
          this.configCache = {
            dailyXpLimit: config.dailyXpLimit,
            levelFormulaBase: config.levelFormulaBase,
            levelFormulaExponent: config.levelFormulaExponent,
            spikeThreshold: config.spikeThreshold,
            spikeWindowMinutes: config.spikeWindowMinutes,
          };
        } else {
          this.setDefaultConfig();
        }
      } else {
        this.setDefaultConfig();
      }

      if (prisma.xpActionConfig) {
        const actions = await prisma.xpActionConfig.findMany();
        this.actionsCache.clear();
        for (const a of actions) {
          this.actionsCache.set(a.actionKey, {
            actionKey: a.actionKey,
            xpAmount: a.xpAmount,
            isActive: a.isActive,
          });
        }
      }
    } catch (_error) {
      this.setDefaultConfig();
      this.actionsCache.clear();
    }
  }

  private setDefaultConfig() {
    this.configCache = {
      dailyXpLimit: 1500,
      levelFormulaBase: 500,
      levelFormulaExponent: 0.6,
      spikeThreshold: 1000,
      spikeWindowMinutes: 5,
    };
  }

  invalidateCache() {
    this.configCache = null;
    this.actionsCache.clear();
  }

  private async ensureConfig(): Promise<CachedConfig> {
    if (!this.configCache) {
      await this.loadConfig();
    }
    return this.configCache!;
  }

  /**
   * Returns the XP amount for a given action key from the cache.
   * Falls back to 0 if the action is not found or is disabled.
   */
  async getXpForAction(actionKey: string): Promise<number> {
    await this.ensureConfig();
    const action = this.actionsCache.get(actionKey);
    if (!action || !action.isActive) return 0;
    return action.xpAmount;
  }

  /**
   * Calculates level based on XP using configurable formula:
   * Level = floor((XP / base)^exponent) + 1
   */
  calculateLevel(xp: number, base?: number, exponent?: number): number {
    const b = base ?? this.configCache?.levelFormulaBase ?? 500;
    const e = exponent ?? this.configCache?.levelFormulaExponent ?? 0.6;
    if (xp <= 0) return 1;
    return Math.floor(Math.pow(xp / b, e)) + 1;
  }

  /**
   * Awards XP to a user, enforcing daily limits and calculating level-ups.
   * Supports eventId for scoped auditing and automatic spike alerts.
   */
  async awardXp(
    userId: string,
    amount: number,
    reason: string,
    uniqueKey?: string,
    eventId?: string,
  ) {
    const config = await this.ensureConfig();

    return await this.prisma
      .$transaction(async (tx: Prisma.TransactionClient) => {
        // 0. LOCK the user row to serialize all awardXp calls for this user
        await tx.$executeRawUnsafe(
          `SELECT id FROM "User" WHERE id = $1 FOR UPDATE`,
          userId,
        );

        // 1. Check for duplicate uniqueKey if provided
        if (uniqueKey) {
          const existingLog = await tx.xpGainLog.findUnique({
            where: {
              userId_uniqueKey: { userId, uniqueKey },
            },
          });

          if (existingLog) {
            return { xpGained: 0, isLevelUp: false, reason: "ALREADY_AWARDED" };
          }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 2. Get today's total XP gain
        const logsToday = await tx.xpGainLog.aggregate({
          where: {
            userId,
            createdAt: { gte: today },
          },
          _sum: { amount: true },
        });

        const currentDailyTotal = logsToday._sum.amount || 0;

        // 3. Enforce daily limit (from config)
        let finalAmount = amount;
        if (currentDailyTotal + amount > config.dailyXpLimit) {
          finalAmount = Math.max(0, config.dailyXpLimit - currentDailyTotal);
        }

        if (finalAmount <= 0) {
          return {
            xpGained: 0,
            isLevelUp: false,
            reason: "DAILY_LIMIT_REACHED",
          };
        }

        // 4. Update User
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { xp: true, level: true },
        });

        if (!user)
          return { xpGained: 0, isLevelUp: false, reason: "USER_NOT_FOUND" };

        const newXp = user.xp + finalAmount;
        const newLevel = this.calculateLevel(newXp);
        const isLevelUp = newLevel > user.level;

        await tx.user.update({
          where: { id: userId },
          data: {
            xp: newXp,
            level: newLevel,
          },
        });

        // 5. Create Log
        await tx.xpGainLog.create({
          data: {
            userId,
            eventId,
            amount: finalAmount,
            reason,
            uniqueKey,
          },
        });

        // 6. Check for Spike Alerts (configurable threshold and window)
        if (eventId) {
          const windowMs = config.spikeWindowMinutes * 60 * 1000;
          const windowAgo = new Date(Date.now() - windowMs);
          const recentGains = await tx.xpGainLog.aggregate({
            where: {
              userId,
              eventId,
              createdAt: { gte: windowAgo },
            },
            _sum: { amount: true },
          });

          const totalRecent = recentGains._sum.amount || 0;
          if (totalRecent >= config.spikeThreshold) {
            await tx.gamificationAlert.create({
              data: {
                eventId,
                userId,
                type: "XP_SPIKE",
                message: `Usuário ganhou ${totalRecent} XP nos últimos ${config.spikeWindowMinutes} minutos.`,
                metadata: {
                  totalXp: totalRecent,
                  windowMinutes: config.spikeWindowMinutes,
                },
              },
            });
          }
        }

        return {
          xpGained: finalAmount,
          newLevel,
          isLevelUp,
          totalXp: newXp,
        };
      })
      .catch((err) => {
        if (err.code === "P2002") {
          return { xpGained: 0, isLevelUp: false, reason: "ALREADY_AWARDED" };
        }
        throw err;
      });
  }

  /**
   * Simulates a level curve for given parameters.
   * Returns an array of { level, xpRequired } up to maxLevel.
   */
  simulateLevelCurve(
    base: number,
    exponent: number,
    maxLevel = 20,
  ): { level: number; xpRequired: number }[] {
    const curve: { level: number; xpRequired: number }[] = [];
    for (let lvl = 1; lvl <= maxLevel; lvl++) {
      if (lvl === 1) {
        curve.push({ level: 1, xpRequired: 0 });
        continue;
      }
      // Inverse formula: XP = base * (level - 1)^(1/exponent)
      const xp = Math.ceil(base * Math.pow(lvl - 1, 1 / exponent));
      curve.push({ level: lvl, xpRequired: xp });
    }
    return curve;
  }

  async getConfig() {
    return this.ensureConfig();
  }

  async getActions() {
    await this.ensureConfig();
    return Array.from(this.actionsCache.values());
  }

  async getEventStats(eventId: string) {
    const [totalXp, badgeCount, activeAlerts, participantCount] =
      await Promise.all([
        this.prisma.xpGainLog.aggregate({
          where: { eventId },
          _sum: { amount: true },
        }),
        this.prisma.userBadge.count({
          where: { eventId },
        }),
        this.prisma.gamificationAlert.count({
          where: { eventId, resolved: false },
        }),
        this.prisma.registration.count({
          where: { eventId },
        }),
      ]);

    return {
      totalXpDistributed: totalXp._sum.amount || 0,
      totalBadgesAwarded: badgeCount,
      activeAlertsCount: activeAlerts,
      totalParticipants: participantCount || 0,
    };
  }

  async getEventRanking(eventId: string, limit = 100) {
    // Note: We sum XP from logs to get "XP earned in this event"
    const ranking = await this.prisma.xpGainLog.groupBy({
      by: ["userId"],
      where: { eventId },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: limit,
    });

    const userIds = ranking.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarUrl: true, level: true },
    });

    return ranking.map((r) => {
      const user = users.find((u) => u.id === r.userId);
      return {
        userId: r.userId,
        userName: user?.name || "Usuário Desconhecido",
        avatarUrl: user?.avatarUrl,
        globalLevel: user?.level || 1,
        eventXp: r._sum.amount || 0,
      };
    });
  }

  async getEventAlerts(eventId: string) {
    return await this.prisma.gamificationAlert.findMany({
      where: { eventId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async resolveAlert(alertId: string) {
    return await this.prisma.gamificationAlert.update({
      where: { id: alertId },
      data: { resolved: true },
    });
  }
}
