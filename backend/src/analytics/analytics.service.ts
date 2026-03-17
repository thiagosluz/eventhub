import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEventAnalytics(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      include: {
        activities: {
          include: {
            enrollments: true,
            type: true,
          },
        },
        registrations: {
          include: {
            tickets: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException("Evento não encontrado.");
    }

    // 1. Participation per Activity
    const activityParticipation = event.activities.map((activity) => ({
      id: activity.id,
      name: activity.title,
      type: activity.type?.name || "Geral",
      enrolled: activity.enrollments.length,
      capacity: activity.capacity || 0,
      occupancyRate: activity.capacity
        ? (activity.enrollments.length / activity.capacity) * 100
        : 0,
    }));

    // 2. Registration Status Breakdown
    const statusCounts = event.registrations.reduce(
      (acc, reg) => {
        const status = reg.tickets[0]?.status || "PENDING";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const registrationStatus = Object.entries(statusCounts).map(
      ([name, value]) => ({
        name,
        value,
      }),
    );

    // 3. Ticket Type Distribution
    const ticketCounts = event.registrations
      .flatMap((r) => r.tickets)
      .reduce(
        (acc, ticket) => {
          const type = ticket.type || "N/A";
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    const ticketDistribution = Object.entries(ticketCounts).map(
      ([name, value]) => ({
        name,
        value,
      }),
    );

    // 4. Daily Registrations (Last 15 days of the event enrollment period or last 15 days from now)
    // For simplicity, last 15 days from now
    const dailyRegistrations = [];
    const now = new Date();
    for (let i = 14; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = event.registrations.filter(
        (r) => new Date(r.createdAt) >= date && new Date(r.createdAt) < nextDay,
      ).length;

      dailyRegistrations.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    return {
      eventId: event.id,
      eventName: event.name,
      activityParticipation,
      registrationStatus,
      ticketDistribution,
      dailyRegistrations,
    };
  }
}
