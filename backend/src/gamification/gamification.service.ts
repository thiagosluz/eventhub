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
  async awardXp(userId: string, amount: number, reason: string, uniqueKey?: string) {
    return await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 0. LOCK the user row to serialize all awardXp calls for this user
      // This prevents race conditions in daily limit calculation
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

      // 2. Get today's total XP gain (inside transaction for consistency)
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

      // 4. Update User (FETCH INSIDE TRANSACTION TO AVOID STALE STATE)
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true },
      });

      if (!user) return { xpGained: 0, isLevelUp: false, reason: "USER_NOT_FOUND" };

      const newXp = user.xp + finalAmount;
      const newLevel = this.calculateLevel(newXp);
      const isLevelUp = newLevel > user.level;

      // 5. Commit changes
      await tx.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel,
        },
      });

      await tx.xpGainLog.create({
        data: {
          userId,
          amount: finalAmount,
          reason,
          uniqueKey,
        },
      });

      return {
        xpGained: finalAmount,
        newLevel,
        isLevelUp,
        totalXp: newXp
      };
    }).catch(err => {
      // Handle potential race condition where unique constraint is hit between check and create
      if (err.code === 'P2002') {
        return { xpGained: 0, isLevelUp: false, reason: "ALREADY_AWARDED" };
      }
      throw err;
    });
  }
}
