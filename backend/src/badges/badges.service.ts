import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  async createBadge(tenantId: string, eventId: string, data: any) {
    return this.prisma.badge.create({
      data: {
        tenantId,
        eventId,
        name: data.name,
        description: data.description,
        iconUrl: data.iconUrl,
        color: data.color || 'blue',
        triggerRule: data.triggerRule || 'MANUAL',
      },
    });
  }

  async getBadgesByEvent(tenantId: string, eventId: string) {
    return this.prisma.badge.findMany({
      where: { tenantId, eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBadge(tenantId: string, badgeId: string, data: any) {
    const badge = await this.prisma.badge.findFirst({
      where: { id: badgeId, tenantId },
    });
    if (!badge) throw new NotFoundException('Badge not found');

    return this.prisma.badge.update({
      where: { id: badgeId },
      data,
    });
  }

  async deleteBadge(tenantId: string, badgeId: string) {
    const badge = await this.prisma.badge.findFirst({
      where: { id: badgeId, tenantId },
    });
    if (!badge) throw new NotFoundException('Badge not found');

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
        event: { select: { name: true, slug: true } }
      },
      orderBy: { earnedAt: 'desc' },
    });
  }

  async getAvailableBadges(userId: string) {
    if (!userId) return [];
    
    // 1. Get all events the user is registered for
    const registrations = await this.prisma.registration.findMany({
      where: { userId },
      select: { eventId: true }
    });
    const eventIds = registrations.map(r => r.eventId);

    // 2. Get all badges for these events
    const allBadges = await this.prisma.badge.findMany({
      where: { 
        OR: [
          { eventId: { in: eventIds } },
          { eventId: null } // Global platform badges
        ]
      },
      include: { event: { select: { name: true } } }
    });

    // 3. Get user's earned badges
    const earnedBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true }
    });
    const earnedIds = new Set(earnedBadges.map(eb => eb.badgeId));

    // 4. Map results
    return allBadges.map(badge => ({
      ...badge,
      isEarned: earnedIds.has(badge.id)
    }));
  }

  async checkAndAwardBadge(userId: string, eventId: string, triggerRule: any) {
    const matchingBadges = await this.prisma.badge.findMany({
      where: { eventId, triggerRule },
    });

    const awarded = [];

    for (const badge of matchingBadges) {
      const existing = await this.prisma.userBadge.findUnique({
        where: {
          userId_badgeId_eventId: {
            userId,
            badgeId: badge.id,
            eventId,
          }
        }
      });

      if (!existing) {
        const userBadge = await this.prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
            eventId,
          }
        });
        awarded.push(userBadge);
      }
    }

    return awarded;
  }
}
