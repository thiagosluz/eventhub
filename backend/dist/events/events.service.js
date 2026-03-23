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
        const existing = await this.prisma.event.findFirst({
            where: { tenantId, slug: data.slug },
        });
        if (existing) {
            throw new Error("Já existe um evento com este slug para a sua organização.");
        }
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error("As datas de início e término devem ser válidas.");
        }
        return this.prisma.event.create({
            data: {
                tenantId,
                name: data.name,
                slug: data.slug,
                description: data.description,
                location: data.location,
                startDate: start,
                endDate: end,
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                themeConfig: data.themeConfig,
                status: (_a = data.status) !== null && _a !== void 0 ? _a : "DRAFT",
            },
        });
    }
    async listEventsForTenant(tenantId) {
        return this.prisma.event.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { registrations: true },
                },
            },
        });
    }
    async findEventById(tenantId, eventId) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
            include: {
                activities: {
                    orderBy: { startAt: "asc" },
                    include: {
                        type: true,
                        speakers: {
                            include: {
                                speaker: true,
                                role: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { registrations: true },
                },
            },
        });
        if (!event) {
            throw new common_1.NotFoundException("Evento não encontrado para este tenant.");
        }
        return event;
    }
    async updateEvent(params) {
        const { tenantId, eventId, data } = params;
        const existing = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Evento não encontrado para este tenant.");
        }
        return this.prisma.event.update({
            where: { id: eventId },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                location: data.location,
                startDate: data.startDate
                    ? isNaN(new Date(data.startDate).getTime())
                        ? (() => {
                            throw new Error("Data de início inválida");
                        })()
                        : new Date(data.startDate)
                    : undefined,
                endDate: data.endDate
                    ? isNaN(new Date(data.endDate).getTime())
                        ? (() => {
                            throw new Error("Data de término inválida");
                        })()
                        : new Date(data.endDate)
                    : undefined,
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
            where: { status: "PUBLISHED" },
            orderBy: { startDate: "asc" },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                        themeConfig: true,
                    },
                },
            },
        });
    }
    async findPublicBySlug(slug, organizerTenantId) {
        const event = await this.prisma.event.findFirst({
            where: {
                slug,
                OR: [
                    { status: "PUBLISHED" },
                    ...(organizerTenantId ? [{ tenantId: organizerTenantId }] : []),
                ],
            },
            include: {
                activities: {
                    orderBy: { startAt: "asc" },
                    include: {
                        type: true,
                        speakers: {
                            include: {
                                speaker: true,
                                role: true,
                            },
                        },
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                        themeConfig: true,
                    },
                },
                forms: {
                    where: { type: "REGISTRATION" },
                    include: {
                        fields: { orderBy: { order: "asc" } },
                    },
                },
            },
        });
        if (!event) {
            throw new common_1.NotFoundException("Evento não encontrado.");
        }
        return event;
    }
    async listParticipants(tenantId, filters) {
        const { eventId, search, status } = filters;
        return this.prisma.registration.findMany({
            where: {
                event: {
                    tenantId,
                    ...(eventId ? { id: eventId } : {}),
                },
                ...(status ? { status } : {}),
                ...(search
                    ? {
                        user: {
                            OR: [
                                { name: { contains: search, mode: "insensitive" } },
                                { email: { contains: search, mode: "insensitive" } },
                            ],
                        },
                    }
                    : {}),
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                event: { select: { name: true } },
                tickets: { select: { type: true, status: true } },
            },
            orderBy: { createdAt: "desc" },
        });
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
                createdAt: "desc",
            },
        });
    }
    async findParticipantDetail(tenantId, registrationId) {
        const reg = await this.prisma.registration.findUnique({
            where: { id: registrationId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                event: { select: { id: true, name: true, tenantId: true } },
                tickets: true,
                enrollments: {
                    include: {
                        activity: {
                            include: { type: true },
                        },
                    },
                },
                formResponses: {
                    include: {
                        form: { select: { name: true } },
                        answers: {
                            include: { field: true },
                        },
                    },
                },
                certificates: {
                    include: {
                        template: { select: { name: true } },
                    },
                },
            },
        });
        if (!reg || reg.event.tenantId !== tenantId) {
            throw new common_1.NotFoundException("Inscrição não encontrada.");
        }
        const history = await this.prisma.registration.findMany({
            where: {
                userId: reg.userId,
                event: { tenantId },
                id: { not: registrationId },
            },
            include: {
                event: { select: { name: true, startDate: true } },
                tickets: { select: { type: true, status: true } },
                certificates: { select: { id: true, issuedAt: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return {
            ...reg,
            history,
        };
    }
    async deleteEvent(tenantId, eventId) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event) {
            throw new common_1.NotFoundException("Evento não encontrado.");
        }
        if (event.status !== "DRAFT") {
            throw new Error("Apenas eventos em rascunho podem ser excluídos.");
        }
        return this.prisma.event.delete({
            where: { id: eventId },
        });
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
//# sourceMappingURL=events.service.js.map