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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EventsService = class EventsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEvent(params) {
        var _a;
        const { tenantId, data } = params;
        return this.prisma.event.create({
            data: {
                tenantId,
                name: data.name,
                slug: data.slug,
                description: data.description,
                location: data.location,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                themeConfig: data.themeConfig,
                status: (_a = data.status) !== null && _a !== void 0 ? _a : 'DRAFT',
            },
        });
    }
    async listEventsForTenant(tenantId) {
        return this.prisma.event.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findEventById(tenantId, eventId) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
            include: {
                activities: { orderBy: { startAt: 'asc' } },
            },
        });
        if (!event) {
            throw new common_1.NotFoundException('Evento não encontrado para este tenant.');
        }
        return event;
    }
    async updateEvent(params) {
        const { tenantId, eventId, data } = params;
        const existing = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Evento não encontrado para este tenant.');
        }
        return this.prisma.event.update({
            where: { id: eventId },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                location: data.location,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                themeConfig: data.themeConfig,
                bannerUrl: data.bannerUrl,
                logoUrl: data.logoUrl,
                status: data.status,
            },
        });
    }
    async findAllPublic() {
        return this.prisma.event.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { startDate: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                location: true,
                startDate: true,
                endDate: true,
                bannerUrl: true,
                logoUrl: true,
            },
        });
    }
    async findPublicBySlug(slug) {
        const event = await this.prisma.event.findFirst({
            where: { slug, status: 'PUBLISHED' },
            include: {
                activities: { orderBy: { startAt: 'asc' } },
                forms: {
                    where: { type: 'REGISTRATION' },
                    include: {
                        fields: { orderBy: { order: 'asc' } },
                    },
                },
            },
        });
        if (!event) {
            throw new common_1.NotFoundException('Evento não encontrado.');
        }
        return event;
    }
    async findMyTickets(userId) {
        return this.prisma.ticket.findMany({
            where: {
                registration: {
                    userId,
                },
            },
            include: {
                event: {
                    select: {
                        name: true,
                        slug: true,
                        startDate: true,
                        endDate: true,
                        location: true,
                        bannerUrl: true,
                        logoUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
//# sourceMappingURL=events.service.js.map