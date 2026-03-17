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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
const prisma_1 = require("../generated/prisma");
let ActivitiesService = class ActivitiesService {
    constructor(prisma, activitiesQueue) {
        this.prisma = prisma;
        this.activitiesQueue = activitiesQueue;
    }
    async onModuleInit() {
        await this.activitiesQueue.add("cleanup-expired-enrollments", {}, {
            repeat: {
                pattern: "0 0 * * *",
            },
        });
    }
    async createActivity(params) {
        const { tenantId, eventId, data } = params;
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event) {
            throw new common_1.ForbiddenException("Evento não pertence a este tenant.");
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
                typeId: data.typeId,
                requiresEnrollment: data.requiresEnrollment || false,
                requiresConfirmation: data.requiresConfirmation || false,
                confirmationDays: data.confirmationDays,
            },
        });
        if (data.speakers && data.speakers.length > 0) {
            await this.prisma.activitySpeaker.createMany({
                data: data.speakers.map((s) => ({
                    activityId: activity.id,
                    speakerId: s.speakerId,
                    roleId: s.roleId,
                })),
                skipDuplicates: true,
            });
        }
        if (!activity.requiresEnrollment) {
            const registrations = await this.prisma.registration.findMany({
                where: { eventId },
                select: { id: true },
            });
            if (registrations.length > 0) {
                await this.prisma.activityEnrollment.createMany({
                    data: registrations.map((r) => ({
                        activityId: activity.id,
                        registrationId: r.id,
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
            throw new common_1.ForbiddenException("Evento não pertence a este tenant.");
        }
        const activities = await this.prisma.activity.findMany({
            where: { eventId },
            include: {
                type: true,
                speakers: {
                    include: {
                        speaker: true,
                        role: true,
                    },
                },
                enrollments: true,
            },
            orderBy: { startAt: "asc" },
        });
        return activities.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            location: a.location,
            startAt: a.startAt,
            endAt: a.endAt,
            capacity: a.capacity,
            remainingSpots: a.capacity != null
                ? Math.max(a.capacity - a.enrollments.length, 0)
                : null,
            type: a.type ? { id: a.type.id, name: a.type.name } : null,
            requiresEnrollment: a.requiresEnrollment,
            requiresConfirmation: a.requiresConfirmation,
            confirmationDays: a.confirmationDays,
            speakers: a.speakers.map((as) => ({
                speaker: as.speaker,
                role: as.role ? { id: as.role.id, name: as.role.name } : null,
            })),
        }));
    }
    async getActivitiesForParticipant(params) {
        const { userId, eventId } = params;
        const activities = await this.prisma.activity.findMany({
            where: { eventId },
            include: {
                type: true,
                speakers: {
                    include: {
                        speaker: true,
                        role: true,
                    },
                },
                enrollments: {
                    where: {
                        registration: {
                            userId,
                        },
                    },
                },
                _count: {
                    select: { enrollments: true },
                },
            },
            orderBy: { startAt: "asc" },
        });
        return activities.map((a) => {
            var _a;
            return ({
                id: a.id,
                title: a.title,
                description: a.description,
                location: a.location,
                startAt: a.startAt,
                endAt: a.endAt,
                capacity: a.capacity,
                remainingSpots: a.capacity != null
                    ? Math.max(a.capacity - a._count.enrollments, 0)
                    : null,
                isEnrolled: a.enrollments.length > 0,
                enrollmentStatus: ((_a = a.enrollments[0]) === null || _a === void 0 ? void 0 : _a.status) || null,
                requiresEnrollment: a.requiresEnrollment,
                requiresConfirmation: a.requiresConfirmation,
                confirmationDays: a.confirmationDays,
                type: a.type ? { id: a.type.id, name: a.type.name } : null,
                speakers: a.speakers.map((as) => ({
                    speaker: as.speaker,
                    role: as.role ? { id: as.role.id, name: as.role.name } : null,
                })),
            });
        });
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
                        role: true,
                    },
                },
                type: true,
                enrollments: true,
            },
        });
        if (!activity) {
            throw new common_1.NotFoundException("Atividade não encontrada para este tenant.");
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
                speaker: as.speaker,
                role: as.role ? { id: as.role.id, name: as.role.name } : null,
            })),
            type: activity.type
                ? { id: activity.type.id, name: activity.type.name }
                : null,
            requiresEnrollment: activity.requiresEnrollment,
            requiresConfirmation: activity.requiresConfirmation,
            confirmationDays: activity.confirmationDays,
        };
    }
    async updateActivity(params) {
        const { tenantId, activityId, data } = params;
        await this.getActivityForTenant(tenantId, activityId);
        const updateData = {
            title: data.title,
            description: data.description,
            location: data.location,
            startAt: data.startAt ? new Date(data.startAt) : undefined,
            endAt: data.endAt ? new Date(data.endAt) : undefined,
            capacity: data.capacity,
            typeId: data.typeId,
            requiresEnrollment: data.requiresEnrollment,
            requiresConfirmation: data.requiresConfirmation,
            confirmationDays: data.confirmationDays,
        };
        await this.prisma.activity.update({
            where: { id: activityId },
            data: updateData,
        });
        if (data.speakers) {
            await this.prisma.activitySpeaker.deleteMany({ where: { activityId } });
            if (data.speakers.length > 0) {
                await this.prisma.activitySpeaker.createMany({
                    data: data.speakers.map((s) => ({
                        activityId,
                        speakerId: s.speakerId,
                        roleId: s.roleId,
                    })),
                });
            }
        }
        const updatedActivity = await this.getActivityForTenant(tenantId, activityId);
        if (!updatedActivity.requiresEnrollment) {
            const activityFromDb = await this.prisma.activity.findUnique({
                where: { id: activityId },
            });
            if (activityFromDb) {
                const registrations = await this.prisma.registration.findMany({
                    where: { eventId: activityFromDb.eventId },
                    select: { id: true },
                });
                if (registrations.length > 0) {
                    await this.prisma.activityEnrollment.createMany({
                        data: registrations.map((r) => ({
                            activityId: activityId,
                            registrationId: r.id,
                        })),
                        skipDuplicates: true,
                    });
                }
            }
        }
        return updatedActivity;
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
            throw new common_1.NotFoundException("Atividade não encontrada.");
        }
        const registration = await this.prisma.registration.findFirst({
            where: {
                eventId: activity.eventId,
                userId,
            },
        });
        if (!registration) {
            throw new common_1.ForbiddenException("Você precisa estar inscrito no evento para se inscrever nas atividades.");
        }
        const otherEnrollments = await this.prisma.activityEnrollment.findMany({
            where: {
                registrationId: registration.id,
                activityId: { not: activityId },
            },
            include: {
                activity: true,
            },
        });
        const hasConflict = otherEnrollments.some((enrollment) => {
            const other = enrollment.activity;
            return activity.startAt < other.endAt && activity.endAt > other.startAt;
        });
        if (hasConflict) {
            throw new common_1.ForbiddenException("Esta atividade conflita com outra em que você já está matriculado.");
        }
        if (activity.capacity != null &&
            activity.enrollments.length >= activity.capacity) {
            throw new common_1.ForbiddenException("Capacidade máxima atingida para esta atividade.");
        }
        const alreadyEnrolled = await this.prisma.activityEnrollment.findFirst({
            where: {
                activityId,
                registrationId: registration.id,
            },
        });
        if (alreadyEnrolled) {
            return activity;
        }
        await this.prisma.activityEnrollment.create({
            data: {
                activityId,
                registrationId: registration.id,
                status: activity.requiresConfirmation
                    ? prisma_1.EnrollmentStatus.PENDING
                    : prisma_1.EnrollmentStatus.CONFIRMED,
                confirmedAt: activity.requiresConfirmation ? null : new Date(),
            },
        });
        return this.prisma.activity.findUnique({
            where: { id: activityId },
            include: { enrollments: true },
        });
    }
    async deleteActivity(tenantId, activityId) {
        const activity = await this.prisma.activity.findFirst({
            where: {
                id: activityId,
                event: { tenantId },
            },
        });
        if (!activity) {
            throw new common_1.NotFoundException("Atividade não encontrada para este tenant.");
        }
        await this.prisma.activitySpeaker.deleteMany({ where: { activityId } });
        await this.prisma.activityEnrollment.deleteMany({ where: { activityId } });
        await this.prisma.attendance.deleteMany({ where: { activityId } });
        return this.prisma.activity.delete({
            where: { id: activityId },
        });
    }
    async createType(tenantId, name) {
        return this.prisma.activityType.create({
            data: { tenantId, name },
        });
    }
    async findAllTypes(tenantId) {
        return this.prisma.activityType.findMany({
            where: { tenantId },
            orderBy: { name: "asc" },
        });
    }
    async removeType(tenantId, id) {
        const type = await this.prisma.activityType.findFirst({
            where: { id, tenantId },
        });
        if (!type)
            throw new common_1.NotFoundException("Type not found");
        return this.prisma.activityType.delete({ where: { id } });
    }
    async listEnrollments(tenantId, activityId) {
        const activity = await this.getActivityForTenant(tenantId, activityId);
        return this.prisma.activityEnrollment.findMany({
            where: { activityId: activity.id },
            include: {
                registration: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async confirmEnrollment(tenantId, activityId, enrollmentId) {
        await this.getActivityForTenant(tenantId, activityId);
        const enrollment = await this.prisma.activityEnrollment.findUnique({
            where: { id: enrollmentId, activityId },
        });
        if (!enrollment) {
            throw new common_1.NotFoundException("Inscrição não encontrada.");
        }
        if (enrollment.status === prisma_1.EnrollmentStatus.CONFIRMED) {
            return enrollment;
        }
        return this.prisma.activityEnrollment.update({
            where: { id: enrollmentId },
            data: {
                status: prisma_1.EnrollmentStatus.CONFIRMED,
                confirmedAt: new Date(),
            },
        });
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)("activities")),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map