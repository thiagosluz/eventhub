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
            attendances: true,
          },
        },
        registrations: {
          include: {
            tickets: {
              include: {
                attendances: true,
              },
            },
            user: true,
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
      attended: activity.attendances.length,
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

    // 4. Daily Registrations
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

    // 5. Overall Event Check-ins
    const totalCheckins = event.registrations.filter((r) =>
      r.tickets.some((t) =>
        t.attendances.some(
          (a) => a.activityId === null || a.activityId === undefined,
        ),
      ),
    ).length;

    return {
      eventId: event.id,
      eventName: event.name,
      totalRegistrations: event.registrations.length,
      totalCheckins,
      activityParticipation,
      registrationStatus,
      ticketDistribution,
      dailyRegistrations,
    };
  }

  async getEventParticipants(tenantId: string, eventId: string) {
    const registrations = await this.prisma.registration.findMany({
      where: {
        eventId,
        event: { tenantId },
      },
      include: {
        user: true,
        tickets: {
          include: {
            attendances: true,
          },
        },
        enrollments: {
          include: {
            activity: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return registrations.map((reg) => ({
      id: reg.id,
      userId: reg.userId,
      name: reg.user.name,
      email: reg.user.email,
      registrationDate: reg.createdAt,
      ticketType: reg.tickets[0]?.type || "FREE",
      ticketStatus: reg.tickets[0]?.status || "PENDING",
      qrCodeToken: reg.tickets[0]?.qrCodeToken,
      attendances:
        reg.tickets[0]?.attendances?.map((a) => ({
          id: a.id,
          activityId: a.activityId,
        })) || [],
      enrollmentsCount: reg.enrollments.length,
    }));
  }

  async getEventCheckins(
    tenantId: string,
    eventId: string,
    activityId?: string,
  ) {
    const attendances = await this.prisma.attendance.findMany({
      where: {
        ticket: {
          eventId,
          event: { tenantId },
        },
        ...(activityId ? { activityId } : { activityId: null }),
      },
      include: {
        ticket: {
          include: {
            registration: {
              include: {
                user: true,
              },
            },
          },
        },
        activity: true,
      },
      orderBy: { checkedAt: "desc" },
    });

    return attendances.map((att) => ({
      id: att.id,
      checkedAt: att.checkedAt,
      name: att.ticket.registration.user.name,
      email: att.ticket.registration.user.email,
      ticketType: att.ticket.type,
      activityName: att.activity?.title || "Check-in Geral",
    }));
  }
}
