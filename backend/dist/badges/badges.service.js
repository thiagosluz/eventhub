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
exports.BadgesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BadgesService = class BadgesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBadge(tenantId, eventId, data) {
        const badge = await this.prisma.badge.create({
            data: {
                tenantId,
                eventId,
                name: data.name,
                description: data.description,
                iconUrl: data.iconUrl,
                color: data.color || 'blue',
                triggerRule: data.triggerRule || 'MANUAL',
                manualDeliveryMode: data.manualDeliveryMode || 'GLOBAL_CODE',
                minRequirement: data.minRequirement ? parseInt(data.minRequirement) : 0,
                claimCode: data.claimCode || null,
            },
        });
        if (data.manualDeliveryMode === 'UNIQUE_CODES' && data.codesCount > 0) {
            const codes = [];
            for (let i = 0; i < data.codesCount; i++) {
                codes.push({
                    badgeId: badge.id,
                    code: this.generateRandomCode(),
                });
            }
            await this.prisma.badgeClaimCode.createMany({
                data: codes,
            });
        }
        return badge;
    }
    generateRandomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            if (i === 3)
                result += '-';
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    async getBadgesByEvent(tenantId, eventId) {
        return this.prisma.badge.findMany({
            where: { tenantId, eventId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateBadge(tenantId, badgeId, data) {
        const badge = await this.prisma.badge.findFirst({
            where: { id: badgeId, tenantId },
        });
        if (!badge)
            throw new common_1.NotFoundException('Badge not found');
        return this.prisma.badge.update({
            where: { id: badgeId },
            data,
        });
    }
    async deleteBadge(tenantId, badgeId) {
        const badge = await this.prisma.badge.findFirst({
            where: { id: badgeId, tenantId },
        });
        if (!badge)
            throw new common_1.NotFoundException('Badge not found');
        return this.prisma.badge.delete({
            where: { id: badgeId },
        });
    }
    async getMyBadges(userId) {
        if (!userId)
            return [];
        return this.prisma.userBadge.findMany({
            where: { userId },
            include: {
                badge: true,
                event: { select: { name: true, slug: true } }
            },
            orderBy: { earnedAt: 'desc' },
        });
    }
    async getAvailableBadges(userId) {
        if (!userId)
            return [];
        const registrations = await this.prisma.registration.findMany({
            where: { userId },
            select: { eventId: true }
        });
        const eventIds = registrations.map(r => r.eventId);
        const allBadges = await this.prisma.badge.findMany({
            where: {
                OR: [
                    { eventId: { in: eventIds } },
                    { eventId: null }
                ]
            },
            include: { event: { select: { name: true } } }
        });
        const earnedBadges = await this.prisma.userBadge.findMany({
            where: { userId },
            select: { badgeId: true }
        });
        const earnedIds = new Set(earnedBadges.map(eb => eb.badgeId));
        return allBadges.map(badge => ({
            ...badge,
            isEarned: earnedIds.has(badge.id)
        }));
    }
    async checkAndAwardBadge(userId, eventId, triggerRule) {
        const matchingBadges = await this.prisma.badge.findMany({
            where: { eventId, triggerRule },
        });
        const awarded = [];
        for (const badge of matchingBadges) {
            if (triggerRule === 'EARLY_BIRD') {
                const userReg = await this.prisma.registration.findFirst({
                    where: { userId, eventId },
                    select: { id: true, createdAt: true }
                });
                if (userReg) {
                    const position = await this.prisma.registration.count({
                        where: { eventId, createdAt: { lt: userReg.createdAt } }
                    });
                    if (position + 1 > (badge.minRequirement || 0))
                        continue;
                }
            }
            if (triggerRule === 'CHECKIN_STREAK') {
                const checkinCount = await this.prisma.attendance.count({
                    where: {
                        activity: { eventId },
                        ticket: {
                            registration: { userId }
                        }
                    }
                });
                if (checkinCount < (badge.minRequirement || 1))
                    continue;
            }
            const existing = await this.prisma.userBadge.findUnique({
                where: {
                    userId_badgeId_eventId: {
                        userId,
                        badgeId: badge.id,
                        eventId,
                    }
                }
            });
            if (!existing) {
                const userBadge = await this.prisma.userBadge.create({
                    data: {
                        userId,
                        badgeId: badge.id,
                        eventId,
                    }
                });
                awarded.push(userBadge);
            }
        }
        return awarded;
    }
    async claimBadge(userId, badgeId, claimCode) {
        const badge = await this.prisma.badge.findUnique({
            where: { id: badgeId }
        });
        if (!badge)
            throw new common_1.NotFoundException('Conquista não encontrada');
        if (badge.triggerRule !== 'MANUAL')
            throw new Error('Esta conquista não pode ser resgatada manualmente');
        if (badge.manualDeliveryMode === 'GLOBAL_CODE') {
            if (badge.claimCode && badge.claimCode !== claimCode)
                throw new Error('Código de resgate inválido');
        }
        else if (badge.manualDeliveryMode === 'UNIQUE_CODES') {
            const uniqueCode = await this.prisma.badgeClaimCode.findFirst({
                where: { badgeId: badge.id, code: claimCode }
            });
            if (!uniqueCode)
                throw new Error('Código inexistente');
            if (uniqueCode.isUsed)
                throw new Error('Este código já foi utilizado');
            await this.prisma.badgeClaimCode.update({
                where: { id: uniqueCode.id },
                data: { isUsed: true, userId, usedAt: new Date() }
            });
        }
        else {
            throw new Error('Esta conquista requer escaneamento pelo organizador');
        }
        const existing = await this.prisma.userBadge.findUnique({
            where: {
                userId_badgeId_eventId: {
                    userId,
                    badgeId: badge.id,
                    eventId: badge.eventId,
                }
            }
        });
        if (existing) {
            if (badge.manualDeliveryMode === 'GLOBAL_CODE')
                throw new Error('Você já possui esta conquista');
            return existing;
        }
        return this.prisma.userBadge.create({
            data: {
                userId,
                badgeId: badge.id,
                eventId: badge.eventId,
            }
        });
    }
    async awardBadgeByScan(tenantId, badgeId, ticketToken) {
        const badge = await this.prisma.badge.findFirst({
            where: { id: badgeId, tenantId }
        });
        if (!badge)
            throw new common_1.NotFoundException('Badge not found or no permission');
        const ticket = await this.prisma.ticket.findFirst({
            where: { qrCodeToken: ticketToken },
            include: { registration: true }
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ingresso inválido');
        const userId = ticket.registration.userId;
        const eventId = badge.eventId || ticket.eventId;
        const existing = await this.prisma.userBadge.findUnique({
            where: {
                userId_badgeId_eventId: {
                    userId,
                    badgeId: badge.id,
                    eventId,
                }
            }
        });
        if (existing)
            return existing;
        return this.prisma.userBadge.create({
            data: {
                userId,
                badgeId: badge.id,
                eventId,
            }
        });
    }
    async getBadgeClaimCodes(tenantId, badgeId) {
        const badge = await this.prisma.badge.findFirst({
            where: { id: badgeId, tenantId }
        });
        if (!badge)
            throw new common_1.NotFoundException('Badge not found');
        return this.prisma.badgeClaimCode.findMany({
            where: { badgeId },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.BadgesService = BadgesService;
exports.BadgesService = BadgesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BadgesService);
//# sourceMappingURL=badges.service.js.map