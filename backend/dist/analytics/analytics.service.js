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
            throw new common_1.NotFoundException("Evento não encontrado.");
        }
        const activityParticipation = event.activities.map((activity) => {
            var _a;
            return ({
                id: activity.id,
                name: activity.title,
                type: ((_a = activity.type) === null || _a === void 0 ? void 0 : _a.name) || "Geral",
                enrolled: activity.enrollments.length,
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
        return {
            eventId: event.id,
            eventName: event.name,
            activityParticipation,
            registrationStatus,
            ticketDistribution,
            dailyRegistrations,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map