"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const argon2 = __importStar(require("argon2"));
const minio_service_1 = require("../storage/minio.service");
const badges_service_1 = require("../badges/badges.service");
let UsersService = class UsersService {
    constructor(prisma, minio, badgesService) {
        this.prisma = prisma;
        this.minio = minio;
        this.badgesService = badgesService;
    }
    async findMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
                bio: true,
                tenantId: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException("Usuário não encontrado.");
        return user;
    }
    async updateProfile(userId, dto) {
        if (dto.email) {
            const existing = await this.prisma.user.findFirst({
                where: { email: dto.email, id: { not: userId } },
            });
            if (existing) {
                throw new common_1.ConflictException("Este e-mail já está em uso por outro usuário.");
            }
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: dto,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
                bio: true,
                tenantId: true,
            },
        });
        await this.syncToSpeaker(userId, {
            name: updatedUser.name,
            email: updatedUser.email,
            bio: updatedUser.bio,
        });
        await this.badgesService.checkAndAwardBadge(userId, null, "PROFILE_COMPLETED");
        return updatedUser;
    }
    async updatePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user)
            throw new common_1.NotFoundException("Usuário não encontrado.");
        const isMatch = await argon2.verify(user.password, dto.currentPassword);
        if (!isMatch) {
            throw new common_1.UnauthorizedException("A senha atual está incorreta.");
        }
        const newPasswordHash = await argon2.hash(dto.newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: newPasswordHash },
        });
        return { message: "Senha atualizada com sucesso." };
    }
    async uploadAvatar(userId, file) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user)
            throw new common_1.NotFoundException("Usuário não encontrado.");
        const objectName = `avatars/${userId}-${Date.now()}`;
        const url = await this.minio.uploadObject({
            bucket: "event-media",
            objectName,
            data: file.buffer,
            contentType: file.mimetype,
        });
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: url },
            select: {
                id: true,
                avatarUrl: true,
            },
        });
        await this.syncToSpeaker(userId, {
            avatarUrl: updatedUser.avatarUrl,
        });
        await this.badgesService.checkAndAwardBadge(userId, null, "PROFILE_COMPLETED");
        return updatedUser;
    }
    async syncToSpeaker(userId, data) {
        const speaker = await this.prisma.speaker.findUnique({
            where: { userId },
        });
        if (speaker) {
            await this.prisma.speaker.update({
                where: { id: speaker.id },
                data,
            });
        }
    }
    async findAll(tenantId) {
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { tenantId },
                    {
                        registrations: {
                            some: {
                                event: {
                                    tenantId,
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
            },
            orderBy: { name: "asc" },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinioService,
        badges_service_1.BadgesService])
], UsersService);
//# sourceMappingURL=users.service.js.map