import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  async createBadge(tenantId: string, eventId: string, data: any) {
    const badge = await this.prisma.badge.create({
      data: {
        tenantId,
        eventId,
        name: data.name,
        description: data.description,
        iconUrl: data.iconUrl,
        color: data.color || "blue",
        triggerRule: data.triggerRule || "MANUAL",
        manualDeliveryMode: data.manualDeliveryMode || "GLOBAL_CODE",
        minRequirement: data.minRequirement ? parseInt(data.minRequirement) : 0,
        claimCode: data.claimCode || null,
      },
    });

    // If UNIQUE_CODES, generate the batch
    if (data.manualDeliveryMode === "UNIQUE_CODES" && data.codesCount > 0) {
      const codes = [];
      for (let i = 0; i < data.codesCount; i++) {
        codes.push({
          badgeId: badge.id,
          code: this.generateRandomCode(),
        });
      }
      await this.prisma.badgeClaimCode.createMany({
        data: codes,
      });
    }

    return badge;
  }

  private generateRandomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No O, 0, I, 1
    let result = "";
    for (let i = 0; i < 6; i++) {
      if (i === 3) result += "-";
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async getBadgesByEvent(tenantId: string, eventId: string) {
    return this.prisma.badge.findMany({
      where: { tenantId, eventId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateBadge(tenantId: string, badgeId: string, data: any) {
    const badge = await this.prisma.badge.findFirst({
      where: { id: badgeId, tenantId },
    });
    if (!badge) throw new NotFoundException("Badge not found");

    return this.prisma.badge.update({
      where: { id: badgeId },
      data,
    });
  }

  async deleteBadge(tenantId: string, badgeId: string) {
    const badge = await this.prisma.badge.findFirst({
      where: { id: badgeId, tenantId },
    });
    if (!badge) throw new NotFoundException("Badge not found");

    return this.prisma.badge.delete({
      where: { id: badgeId },
    });
  }

  async getMyBadges(userId: string) {
    if (!userId) return [];
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
        event: { select: { name: true, slug: true } },
      },
      orderBy: { earnedAt: "desc" },
    });
  }

  async getAvailableBadges(userId: string) {
    if (!userId) return [];

    // 1. Get all events the user is registered for
    const registrations = await this.prisma.registration.findMany({
      where: { userId },
      select: { eventId: true },
    });
    const eventIds = registrations.map((r) => r.eventId);

    // 2. Get all badges for these events
    const allBadges = await this.prisma.badge.findMany({
      where: {
        OR: [
          { eventId: { in: eventIds } },
          { eventId: null }, // Global platform badges
        ],
      },
      include: { event: { select: { name: true } } },
    });

    // 3. Get user's earned badges
    const earnedBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const earnedIds = new Set(earnedBadges.map((eb) => eb.badgeId));

    // 4. Map results
    return allBadges.map((badge) => ({
      ...badge,
      isEarned: earnedIds.has(badge.id),
    }));
  }

  async checkAndAwardBadge(userId: string, eventId: string, triggerRule: any) {
    let matchingBadges: any[];

    if (triggerRule === "PROFILE_COMPLETED") {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true },
      });

      if (!user || !user.tenantId) return [];

      matchingBadges = await this.prisma.badge.findMany({
        where: {
          tenantId: user.tenantId,
          triggerRule: "PROFILE_COMPLETED",
        },
      });
    } else {
      matchingBadges = await this.prisma.badge.findMany({
        where: { eventId, triggerRule },
      });
    }

    const awarded = [];

    for (const badge of matchingBadges) {
      if (triggerRule === "EARLY_BIRD") {
        const userReg = await this.prisma.registration.findFirst({
          where: { userId, eventId },
          select: { id: true, createdAt: true },
        });

        if (userReg) {
          const position = await this.prisma.registration.count({
            where: { eventId, createdAt: { lt: userReg.createdAt } },
          });

          if (position + 1 > (badge.minRequirement || 0)) continue;
        }
      }

      if (triggerRule === "CHECKIN_STREAK") {
        const checkinCount = await this.prisma.attendance.count({
          where: {
            activity: { eventId },
            ticket: {
              registration: { userId },
            },
          },
        });

        if (checkinCount < (badge.minRequirement || 1)) continue;
      }

      if (badge.triggerRule === "ACTIVITY_HOURS") {
        const attendances = await this.prisma.attendance.findMany({
          where: {
            ticket: {
              registration: {
                userId,
                event: { tenantId: badge.tenantId },
              },
            },
            activityId: { not: null },
          },
          include: { activity: true },
        });

        const totalMinutes = attendances.reduce((acc, curr) => {
          if (!curr.activity) return acc;
          const duration =
            (curr.activity.endAt.getTime() - curr.activity.startAt.getTime()) /
            (1000 * 60);
          return acc + duration;
        }, 0);

        const totalHours = totalMinutes / 60;
        if (totalHours < (badge.minRequirement || 0)) continue;
      }

      if (badge.triggerRule === "EVENT_COUNT") {
        const eventCount = await this.prisma.registration.count({
          where: {
            userId,
            event: { tenantId: badge.tenantId },
            tickets: {
              some: { status: "COMPLETED" },
            },
          },
        });

        if (eventCount < (badge.minRequirement || 1)) continue;
      }

      if (badge.triggerRule === "PROFILE_COMPLETED") {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user?.bio || user.bio.length < 50 || !user?.avatarUrl) continue;
      }

      const targetEventId = badge.eventId || eventId;

      const existing = await this.prisma.userBadge.findUnique({
        where: {
          userId_badgeId_eventId: {
            userId,
            badgeId: badge.id,
            eventId: targetEventId as any,
          },
        },
      });

      if (!existing) {
        const userBadge = await this.prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
            eventId: targetEventId as any,
          },
        });
        awarded.push(userBadge);
      }
    }

    return awarded;
  }

  async claimBadge(userId: string, badgeId: string, claimCode: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) throw new NotFoundException("Conquista não encontrada");
    if (badge.triggerRule !== "MANUAL")
      throw new BadRequestException(
        "Esta conquista não pode ser resgatada manualmente",
      );

    // Validation based on delivery mode
    if (badge.manualDeliveryMode === "GLOBAL_CODE") {
      if (badge.claimCode && badge.claimCode !== claimCode)
        throw new BadRequestException("Código de resgate inválido");
    } else if (badge.manualDeliveryMode === "UNIQUE_CODES") {
      const uniqueCode = await this.prisma.badgeClaimCode.findFirst({
        where: { badgeId: badge.id, code: claimCode },
      });

      if (!uniqueCode) throw new BadRequestException("Código inexistente");
      if (uniqueCode.isUsed)
        throw new BadRequestException("Este código já foi utilizado");

      // Mark as used
      await this.prisma.badgeClaimCode.update({
        where: { id: uniqueCode.id },
        data: { isUsed: true, userId, usedAt: new Date() },
      });
    } else {
      throw new Error("Esta conquista requer escaneamento pelo organizador");
    }

    const existing = await this.prisma.userBadge.findUnique({
      where: {
        userId_badgeId_eventId: {
          userId,
          badgeId: badge.id,
          eventId: badge.eventId!,
        },
      },
    });

    if (existing) {
      // Se for código único, o erro acima já deu, mas se for global...
      if (badge.manualDeliveryMode === "GLOBAL_CODE")
        throw new BadRequestException("Você já possui esta conquista");
      return existing;
    }

    return this.prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
        eventId: badge.eventId,
      },
    });
  }

  async awardBadgeByScan(
    tenantId: string,
    badgeId: string,
    ticketToken: string,
  ) {
    // 1. Find the badge and verify permission
    const badge = await this.prisma.badge.findFirst({
      where: { id: badgeId, tenantId },
    });
    if (!badge) throw new NotFoundException("Badge not found or no permission");

    // 2. Find the user from ticket
    const ticket = await this.prisma.ticket.findFirst({
      where: { qrCodeToken: ticketToken },
      include: { registration: true },
    });
    if (!ticket) throw new NotFoundException("Ingresso inválido");

    const userId = ticket.registration.userId;
    const eventId = badge.eventId || ticket.eventId;

    // 3. Award
    const existing = await this.prisma.userBadge.findUnique({
      where: {
        userId_badgeId_eventId: {
          userId,
          badgeId: badge.id,
          eventId,
        },
      },
    });

    if (existing) return existing;

    return this.prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
        eventId,
      },
    });
  }

  async getBadgeClaimCodes(tenantId: string, badgeId: string) {
    const badge = await this.prisma.badge.findFirst({
      where: { id: badgeId, tenantId },
    });
    if (!badge) throw new NotFoundException("Badge not found");

    return this.prisma.badgeClaimCode.findMany({
      where: { badgeId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAwardedHistory(tenantId: string, eventId: string) {
    // 1. Get all badges for this event
    const eventBadges = await this.prisma.badge.findMany({
      where: { eventId, tenantId },
      select: { id: true, name: true, iconUrl: true },
    });

    const badgeIds = eventBadges.map((b) => b.id);

    // 2. Get all awards
    const awards = await this.prisma.userBadge.findMany({
      where: { badgeId: { in: badgeIds }, eventId },
      include: {
        user: { select: { name: true, email: true } },
        badge: { select: { name: true, iconUrl: true, color: true } },
      },
      orderBy: { earnedAt: "desc" },
    });

    return awards;
  }

  async revokeBadge(tenantId: string, userBadgeId: string) {
    const userBadge = await this.prisma.userBadge.findUnique({
      where: { id: userBadgeId },
      include: { badge: true },
    });

    if (!userBadge) throw new NotFoundException("Conquista não encontrada");
    if (userBadge.badge.tenantId !== tenantId)
      throw new ForbiddenException("Sem permissão para revogar esta conquista");

    return this.prisma.userBadge.delete({
      where: { id: userBadgeId },
    });
  }
}
