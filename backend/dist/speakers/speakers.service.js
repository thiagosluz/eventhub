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
exports.SpeakersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../storage/minio.service");
const roles_types_1 = require("../auth/roles.types");
let SpeakersService = class SpeakersService {
    constructor(prisma, minio) {
        this.prisma = prisma;
        this.minio = minio;
    }
    async create(tenantId, data) {
        const speaker = await this.prisma.speaker.create({
            data: {
                ...data,
                tenantId,
            },
        });
        if (data.userId) {
            await this.upgradeUserToSpeaker(data.userId);
        }
        return speaker;
    }
    async findAll(tenantId) {
        return this.prisma.speaker.findMany({
            where: { tenantId },
            orderBy: { name: "asc" },
        });
    }
    async findOne(tenantId, id) {
        const speaker = await this.prisma.speaker.findFirst({
            where: { id, tenantId },
        });
        if (!speaker) {
            throw new common_1.NotFoundException(`Speaker with ID ${id} not found.`);
        }
        return speaker;
    }
    async update(tenantId, id, data) {
        const existingSpeaker = await this.findOne(tenantId, id);
        if (data.userId === null && existingSpeaker.userId) {
            await this.downgradeUserToParticipant(existingSpeaker.userId);
        }
        const updatedSpeaker = await this.prisma.speaker.update({
            where: { id },
            data,
        });
        if (existingSpeaker.userId) {
            const userSyncData = {};
            if (data.name)
                userSyncData.name = data.name;
            if (data.email)
                userSyncData.email = data.email;
            if (data.bio)
                userSyncData.bio = data.bio;
            if (data.avatarUrl)
                userSyncData.avatarUrl = data.avatarUrl;
            if (Object.keys(userSyncData).length > 0) {
                await this.prisma.user.update({
                    where: { id: existingSpeaker.userId },
                    data: userSyncData,
                });
            }
        }
        if (data.userId) {
            await this.upgradeUserToSpeaker(data.userId);
        }
        return updatedSpeaker;
    }
    async upgradeUserToSpeaker(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user && user.role === roles_types_1.UserRole.PARTICIPANT) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { role: roles_types_1.UserRole.SPEAKER },
            });
        }
    }
    async downgradeUserToParticipant(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user && user.role === roles_types_1.UserRole.SPEAKER) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { role: roles_types_1.UserRole.PARTICIPANT },
            });
        }
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        return this.prisma.speaker.delete({
            where: { id },
        });
    }
    async uploadAvatar(tenantId, file) {
        const fileExt = file.originalname.split(".").pop();
        const fileName = `speakers/${tenantId}/${Date.now()}.${fileExt}`;
        const url = await this.minio.uploadObject({
            bucket: "eventhub",
            objectName: fileName,
            data: file.buffer,
            contentType: file.mimetype,
        });
        return { url };
    }
    async createRole(tenantId, name) {
        return this.prisma.speakerRole.create({
            data: { tenantId, name },
        });
    }
    async findAllRoles(tenantId) {
        return this.prisma.speakerRole.findMany({
            where: { tenantId },
            orderBy: { name: "asc" },
        });
    }
    async removeRole(tenantId, id) {
        const role = await this.prisma.speakerRole.findFirst({
            where: { id, tenantId },
        });
        if (!role)
            throw new common_1.NotFoundException("Role not found");
        return this.prisma.speakerRole.delete({ where: { id } });
    }
    async findByUserId(userId) {
        const speaker = await this.prisma.speaker.findUnique({
            where: { userId },
        });
        if (!speaker)
            throw new common_1.NotFoundException("Perfil de palestrante não encontrado para este usuário.");
        return speaker;
    }
    async findActivities(speakerId) {
        return this.prisma.activitySpeaker.findMany({
            where: { speakerId },
            include: {
                activity: {
                    include: {
                        event: { select: { name: true, slug: true } },
                        type: true,
                        _count: { select: { enrollments: true } },
                    },
                },
                role: true,
            },
            orderBy: { activity: { startAt: "asc" } },
        });
    }
    async getFeedbacks(speakerId) {
        const activities = await this.prisma.activitySpeaker.findMany({
            where: { speakerId },
            select: { activityId: true },
        });
        const activityIds = activities.map((a) => a.activityId);
        return this.prisma.activityFeedback.findMany({
            where: { activityId: { in: activityIds } },
            include: {
                activity: { select: { title: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async addMaterial(activityId, data) {
        return this.prisma.activityMaterial.create({
            data: {
                activityId,
                title: data.title,
                fileUrl: data.fileUrl,
                fileType: data.fileType,
            },
        });
    }
};
exports.SpeakersService = SpeakersService;
exports.SpeakersService = SpeakersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinioService])
], SpeakersService);
//# sourceMappingURL=speakers.service.js.map