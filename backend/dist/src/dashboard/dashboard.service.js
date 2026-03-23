"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(tenantId) {
        const revenueData = await this.prisma.ticket.aggregate({
            _sum: { price: true },
            where: {
                event: { tenantId },
                status: "COMPLETED",
            },
        });
        const registrationsCount = await this.prisma.registration.count({
            where: {
                event: { tenantId },
            },
        });
        const activeEventsCount = await this.prisma.event.count({
            where: {
                tenantId,
                status: "PUBLISHED",
            },
        });
        const ticketsSoldCount = await this.prisma.ticket.count({
            where: {
                event: { tenantId },
                status: "COMPLETED",
            },
        });
        const [recentRegistrations, recentEvents] = await Promise.all([
            this.prisma.registration.findMany({
                where: { event: { tenantId } },
                take: 3,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { name: true } },
                    event: { select: { name: true } },
                },
            }),
            this.prisma.event.findMany({
                where: { tenantId },
                take: 2,
                orderBy: { updatedAt: "desc" },
                select: { id: true, name: true, updatedAt: true, status: true },
            }),
        ]);
        const registrationActivities = recentRegistrations.map((reg) => ({
            id: reg.id,
            type: "REGISTRATION",
            description: `${reg.user.name} inscreveu-se no evento.`,
            timestamp: reg.createdAt,
            eventTitle: reg.event.name,
        }));
        const eventActivities = recentEvents.map((evt) => ({
            id: evt.id,
            type: "EVENT_UPDATE",
            description: `Evento "${evt.name}" foi atualizado para ${evt.status}.`,
            timestamp: evt.updatedAt,
            eventTitle: evt.name,
        }));
        const recentActivities = [
            ...registrationActivities,
            ...eventActivities,
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const eventsWithSales = await this.prisma.event.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { registrations: true },
                },
                tickets: {
                    where: { status: "COMPLETED" },
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
            timeSeriesData: await this.getTimeSeriesData(tenantId),
        };
    }
    async getTimeSeriesData(tenantId) {
        const days = 30;
        const timeSeriesData = [];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            const [revenueData, salesCount] = await Promise.all([
                this.prisma.ticket.aggregate({
                    _sum: { price: true },
                    where: {
                        event: { tenantId },
                        status: "COMPLETED",
                        createdAt: { gte: date, lt: nextDay },
                    },
                }),
                this.prisma.registration.count({
                    where: {
                        event: { tenantId },
                        createdAt: { gte: date, lt: nextDay },
                    },
                }),
            ]);
            timeSeriesData.push({
                date: date.toISOString().split("T")[0],
                revenue: Number(revenueData._sum.price || 0),
                sales: salesCount,
            });
        }
        return timeSeriesData;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map