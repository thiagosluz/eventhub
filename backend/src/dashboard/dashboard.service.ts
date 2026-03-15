import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(tenantId: string): Promise<DashboardStatsDto> {
    // 1. Total Revenue
    const revenueData = await this.prisma.ticket.aggregate({
      _sum: { price: true },
      where: {
        event: { tenantId },
        status: 'COMPLETED',
      },
    });

    // 2. Total Registrations
    const registrationsCount = await this.prisma.registration.count({
      where: {
        event: { tenantId },
      },
    });

    // 3. Active Events
    const activeEventsCount = await this.prisma.event.count({
      where: {
        tenantId,
        status: 'PUBLISHED',
      },
    });

    // 4. Total Tickets Sold
    const ticketsSoldCount = await this.prisma.ticket.count({
      where: {
        event: { tenantId },
        status: 'COMPLETED',
      },
    });

    // 5. Recent Activities (Merged Registrations and Event Updates)
    const [recentRegistrations, recentEvents] = await Promise.all([
      this.prisma.registration.findMany({
        where: { event: { tenantId } },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          event: { select: { name: true } },
        },
      }),
      this.prisma.event.findMany({
        where: { tenantId },
        take: 2,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, updatedAt: true, status: true },
      }),
    ]);

    const registrationActivities = recentRegistrations.map((reg) => ({
      id: reg.id,
      type: 'REGISTRATION',
      description: `${reg.user.name} inscreveu-se no evento.`,
      timestamp: reg.createdAt,
      eventTitle: reg.event.name,
    }));

    const eventActivities = recentEvents.map((evt) => ({
      id: evt.id,
      type: 'EVENT_UPDATE',
      description: `Evento "${evt.name}" foi atualizado para ${evt.status}.`,
      timestamp: evt.updatedAt,
      eventTitle: evt.name,
    }));

    const recentActivities = [...registrationActivities, ...eventActivities].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    // 6. Event Sales breakdown
    const eventsWithSales = await this.prisma.event.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { registrations: true },
        },
        tickets: {
          where: { status: 'COMPLETED' },
          select: { price: true },
        },
      },
    });

    const eventSales = eventsWithSales.map((event) => {
      const revenue = event.tickets.reduce((sum, t) => sum + Number(t.price), 0);
      return {
        name: event.name,
        sales: event._count.registrations,
        revenue,
      };
    });

    return {
      totalRevenue: Number(revenueData._sum.price || 0),
      totalRegistrations: registrationsCount,
      activeEvents: activeEventsCount,
      ticketsSold: ticketsSoldCount,
      recentActivities,
      eventSales,
    };
  }
}
