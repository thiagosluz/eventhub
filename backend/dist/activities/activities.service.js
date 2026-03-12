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
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ActivitiesService = class ActivitiesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createActivity(params) {
        const { tenantId, eventId, data } = params;
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event) {
            throw new common_1.ForbiddenException('Evento não pertence a este tenant.');
        }
        const activity = await this.prisma.activity.create({
            data: {
                eventId,
                title: data.title,
                description: data.description,
                location: data.location,
                startAt: new Date(data.startAt),
                endAt: new Date(data.endAt),
                capacity: data.capacity,
            },
        });
        if (data.speakerIds && data.speakerIds.length > 0) {
            const speakers = await this.prisma.speaker.findMany({
                where: { id: { in: data.speakerIds }, tenantId },
            });
            if (speakers.length > 0) {
                await this.prisma.activitySpeaker.createMany({
                    data: speakers.map((speaker) => ({
                        activityId: activity.id,
                        speakerId: speaker.id,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        return this.getActivityForTenant(tenantId, activity.id);
    }
    async listActivitiesForEvent(tenantId, eventId) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event) {
            throw new common_1.ForbiddenException('Evento não pertence a este tenant.');
        }
        const activities = await this.prisma.activity.findMany({
            where: { eventId },
            include: {
                speakers: {
                    include: {
                        speaker: true,
                    },
                },
                enrollments: true,
            },
            orderBy: { startAt: 'asc' },
        });
        return activities.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            location: a.location,
            startAt: a.startAt,
            endAt: a.endAt,
            capacity: a.capacity,
            remainingSpots: a.capacity != null ? Math.max(a.capacity - a.enrollments.length, 0) : null,
            speakers: a.speakers.map((as) => ({
                id: as.speaker.id,
                name: as.speaker.name,
                bio: as.speaker.bio,
                avatarUrl: as.speaker.avatarUrl,
            })),
        }));
    }
    async getActivityForTenant(tenantId, activityId) {
        const activity = await this.prisma.activity.findFirst({
            where: {
                id: activityId,
                event: { tenantId },
            },
            include: {
                speakers: {
                    include: {
                        speaker: true,
                    },
                },
                enrollments: true,
            },
        });
        if (!activity) {
            throw new common_1.NotFoundException('Atividade não encontrada para este tenant.');
        }
        return {
            id: activity.id,
            title: activity.title,
            description: activity.description,
            location: activity.location,
            startAt: activity.startAt,
            endAt: activity.endAt,
            capacity: activity.capacity,
            remainingSpots: activity.capacity != null
                ? Math.max(activity.capacity - activity.enrollments.length, 0)
                : null,
            speakers: activity.speakers.map((as) => ({
                id: as.speaker.id,
                name: as.speaker.name,
                bio: as.speaker.bio,
                avatarUrl: as.speaker.avatarUrl,
            })),
        };
    }
    async updateActivity(params) {
        const { tenantId, activityId, data } = params;
        const existing = await this.prisma.activity.findFirst({
            where: {
                id: activityId,
                event: { tenantId },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Atividade não encontrada para este tenant.');
        }
        await this.prisma.activity.update({
            where: { id: activityId },
            data: {
                title: data.title,
                description: data.description,
                location: data.location,
                startAt: data.startAt ? new Date(data.startAt) : undefined,
                endAt: data.endAt ? new Date(data.endAt) : undefined,
                capacity: data.capacity,
            },
        });
        if (data.speakerIds) {
            await this.prisma.activitySpeaker.deleteMany({
                where: { activityId },
            });
            if (data.speakerIds.length > 0) {
                const speakers = await this.prisma.speaker.findMany({
                    where: { id: { in: data.speakerIds }, tenantId },
                });
                if (speakers.length > 0) {
                    await this.prisma.activitySpeaker.createMany({
                        data: speakers.map((speaker) => ({
                            activityId,
                            speakerId: speaker.id,
                        })),
                        skipDuplicates: true,
                    });
                }
            }
        }
        return this.getActivityForTenant(tenantId, activityId);
    }
    async enrollInActivity(params) {
        const { userId, activityId } = params;
        const activity = await this.prisma.activity.findUnique({
            where: { id: activityId },
            include: {
                event: true,
                enrollments: true,
            },
        });
        if (!activity) {
            throw new common_1.NotFoundException('Atividade não encontrada.');
        }
        const registration = await this.prisma.registration.findFirst({
            where: {
                eventId: activity.eventId,
                userId,
            },
        });
        let effectiveRegistration = registration;
        if (!effectiveRegistration) {
            effectiveRegistration = await this.prisma.registration.create({
                data: {
                    eventId: activity.eventId,
                    userId,
                },
            });
        }
        if (activity.capacity != null &&
            activity.enrollments.length >= activity.capacity) {
            throw new common_1.ForbiddenException('Capacidade máxima atingida para esta atividade.');
        }
        const alreadyEnrolled = await this.prisma.activityEnrollment.findFirst({
            where: {
                activityId,
                registrationId: effectiveRegistration.id,
            },
        });
        if (alreadyEnrolled) {
            return activity;
        }
        await this.prisma.activityEnrollment.create({
            data: {
                activityId,
                registrationId: effectiveRegistration.id,
            },
        });
        return this.prisma.activity.findUnique({
            where: { id: activityId },
            include: { enrollments: true },
        });
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map