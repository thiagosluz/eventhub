import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "../generated/prisma";

@Injectable()
export class GamificationService {
  private readonly DAILY_XP_LIMIT = 1500;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates level based on XP using the formula: Level = floor((XP / 500)^0.6) + 1
   */
  calculateLevel(xp: number): number {
    if (xp <= 0) return 1;
    return Math.floor(Math.pow(xp / 500, 0.6)) + 1;
  }

  /**
   * Awards XP to a user, enforcing daily limits and calculating level-ups.
   * Now supporting a uniqueKey to prevent duplicate awards for the same action.
   */
  /**
   * Awards XP to a user, enforcing daily limits and calculating level-ups.
   * Supports eventId for scoped auditing and automatic spike alerts.
   */
  async awardXp(userId: string, amount: number, reason: string, uniqueKey?: string, eventId?: string) {
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 0. LOCK the user row to serialize all awardXp calls for this user
      await tx.$executeRawUnsafe(`SELECT id FROM "User" WHERE id = $1 FOR UPDATE`, userId);

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

      // 3. Enforce daily limit
      let finalAmount = amount;
      if (currentDailyTotal + amount > this.DAILY_XP_LIMIT) {
        finalAmount = Math.max(0, this.DAILY_XP_LIMIT - currentDailyTotal);
      }

      if (finalAmount <= 0) {
        return { xpGained: 0, isLevelUp: false, reason: "DAILY_LIMIT_REACHED" };
      }

      // 4. Update User
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true },
      });

      if (!user) return { xpGained: 0, isLevelUp: false, reason: "USER_NOT_FOUND" };

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

      // 6. Check for Spike Alerts (1000 XP in 5 minutes)
      if (eventId) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentGains = await tx.xpGainLog.aggregate({
          where: {
            userId,
            eventId,
            createdAt: { gte: fiveMinutesAgo },
          },
          _sum: { amount: true },
        });

        const totalRecent = recentGains._sum.amount || 0;
        if (totalRecent >= 1000) {
          await tx.gamificationAlert.create({
            data: {
              eventId,
              userId,
              type: "XP_SPIKE",
              message: `Usuário ganhou ${totalRecent} XP nos últimos 5 minutos.`,
              metadata: { totalXp: totalRecent, windowMinutes: 5 },
            },
          });
        }
      }

      return {
        xpGained: finalAmount,
        newLevel,
        isLevelUp,
        totalXp: newXp
      };
    }).catch(err => {
      if (err.code === 'P2002') {
        return { xpGained: 0, isLevelUp: false, reason: "ALREADY_AWARDED" };
      }
      throw err;
    });
  }

  async getEventStats(eventId: string) {
    const [totalXp, badgeCount, activeAlerts, participantCount] = await Promise.all([
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
      by: ['userId'],
      where: { eventId },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    const userIds = ranking.map(r => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarUrl: true, level: true },
    });

    return ranking.map(r => {
      const user = users.find(u => u.id === r.userId);
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveAlert(alertId: string) {
    return await this.prisma.gamificationAlert.update({
      where: { id: alertId },
      data: { resolved: true },
    });
  }
}
