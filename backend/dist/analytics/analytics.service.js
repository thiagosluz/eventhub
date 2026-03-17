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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getEventAnalytics(tenantId, eventId) {
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
            throw new common_1.NotFoundException("Evento não encontrado.");
        }
        const activityParticipation = event.activities.map((activity) => {
            var _a;
            return ({
                id: activity.id,
                name: activity.title,
                type: ((_a = activity.type) === null || _a === void 0 ? void 0 : _a.name) || "Geral",
                enrolled: activity.enrollments.length,
                attended: activity.attendances.length,
                capacity: activity.capacity || 0,
                occupancyRate: activity.capacity
                    ? (activity.enrollments.length / activity.capacity) * 100
                    : 0,
            });
        });
        const statusCounts = event.registrations.reduce((acc, reg) => {
            var _a;
            const status = ((_a = reg.tickets[0]) === null || _a === void 0 ? void 0 : _a.status) || "PENDING";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const registrationStatus = Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value,
        }));
        const ticketCounts = event.registrations
            .flatMap((r) => r.tickets)
            .reduce((acc, ticket) => {
            const type = ticket.type || "N/A";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        const ticketDistribution = Object.entries(ticketCounts).map(([name, value]) => ({
            name,
            value,
        }));
        const dailyRegistrations = [];
        const now = new Date();
        for (let i = 14; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            const count = event.registrations.filter((r) => new Date(r.createdAt) >= date && new Date(r.createdAt) < nextDay).length;
            dailyRegistrations.push({
                date: date.toISOString().split("T")[0],
                count,
            });
        }
        const totalCheckins = event.registrations.filter((r) => r.tickets.some((t) => t.attendances.some((a) => a.activityId === null || a.activityId === undefined))).length;
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
    async getEventParticipants(tenantId, eventId) {
        const registrations = await this.prisma.registration.findMany({
            where: {
                eventId,
                event: { tenantId },
            },
            include: {
                user: true,
                tickets: true,
                enrollments: {
                    include: {
                        activity: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return registrations.map((reg) => {
            var _a, _b, _c;
            return ({
                id: reg.id,
                userId: reg.userId,
                name: reg.user.name,
                email: reg.user.email,
                registrationDate: reg.createdAt,
                ticketType: ((_a = reg.tickets[0]) === null || _a === void 0 ? void 0 : _a.type) || "FREE",
                ticketStatus: ((_b = reg.tickets[0]) === null || _b === void 0 ? void 0 : _b.status) || "PENDING",
                qrCodeToken: (_c = reg.tickets[0]) === null || _c === void 0 ? void 0 : _c.qrCodeToken,
                enrollmentsCount: reg.enrollments.length,
            });
        });
    }
    async getEventCheckins(tenantId, eventId, activityId) {
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
        return attendances.map((att) => {
            var _a;
            return ({
                id: att.id,
                checkedAt: att.checkedAt,
                name: att.ticket.registration.user.name,
                email: att.ticket.registration.user.email,
                ticketType: att.ticket.type,
                activityName: ((_a = att.activity) === null || _a === void 0 ? void 0 : _a.title) || "Check-in Geral",
            });
        });
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map