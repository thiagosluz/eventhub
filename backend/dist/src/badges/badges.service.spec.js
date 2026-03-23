"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const badges_service_1 = require("./badges.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
describe('BadgesService', () => {
    let service;
    const mockPrismaService = {
        badge: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        badgeClaimCode: {
            createMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
        },
        userBadge: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn().mockResolvedValue({ userId: 'u1', badgeId: 'b1' }),
        },
        user: {
            findUnique: jest.fn(),
        },
        registration: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            count: jest.fn(),
        },
        attendance: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        ticket: {
            findFirst: jest.fn(),
        }
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                badges_service_1.BadgesService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(badges_service_1.BadgesService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('createBadge', () => {
        it('should create a badge and generate codes if UNIQUE_CODES is set', async () => {
            const dto = {
                name: 'Early Bird',
                manualDeliveryMode: 'UNIQUE_CODES',
                codesCount: 5,
            };
            mockPrismaService.badge.create.mockResolvedValue({ id: 'b1' });
            await service.createBadge('t1', 'e1', dto);
            expect(mockPrismaService.badge.create).toHaveBeenCalled();
            expect(mockPrismaService.badgeClaimCode.createMany).toHaveBeenCalled();
            const codes = mockPrismaService.badgeClaimCode.createMany.mock.calls[0][0].data;
            expect(codes).toHaveLength(5);
        });
    });
    describe('checkAndAwardBadge', () => {
        describe('PROFILE_COMPLETED', () => {
            it('should award badge if profile is complete (bio + avatar)', async () => {
                mockPrismaService.user.findUnique.mockResolvedValue({
                    id: 'u1',
                    tenantId: 't1',
                    bio: 'This is a long enough bio for the badge requirement of 50 characters.',
                    avatarUrl: 'http://avatar.com',
                });
                mockPrismaService.badge.findMany.mockResolvedValue([{ id: 'b1', tenantId: 't1', triggerRule: 'PROFILE_COMPLETED' }]);
                mockPrismaService.userBadge.findUnique.mockResolvedValue(null);
                const result = await service.checkAndAwardBadge('u1', 'e1', 'PROFILE_COMPLETED');
                expect(result).toHaveLength(1);
                expect(mockPrismaService.userBadge.create).toHaveBeenCalled();
            });
            it('should NOT award badge if bio is too short', async () => {
                mockPrismaService.user.findUnique.mockResolvedValue({
                    id: 'u1',
                    tenantId: 't1',
                    bio: 'Short bio',
                    avatarUrl: 'http://avatar.com',
                });
                mockPrismaService.badge.findMany.mockResolvedValue([{ id: 'b1', triggerRule: 'PROFILE_COMPLETED' }]);
                const result = await service.checkAndAwardBadge('u1', 'e1', 'PROFILE_COMPLETED');
                expect(result).toHaveLength(0);
            });
        });
        describe('EARLY_BIRD', () => {
            it('should award badge if user is within top N registrations', async () => {
                const userReg = { id: 'r1', createdAt: new Date() };
                mockPrismaService.badge.findMany.mockResolvedValue([{ id: 'b1', triggerRule: 'EARLY_BIRD', minRequirement: 10 }]);
                mockPrismaService.registration.findFirst.mockResolvedValue(userReg);
                mockPrismaService.registration.count.mockResolvedValue(5);
                mockPrismaService.userBadge.findUnique.mockResolvedValue(null);
                const result = await service.checkAndAwardBadge('u1', 'e1', 'EARLY_BIRD');
                expect(result).toHaveLength(1);
            });
        });
    });
    describe('claimBadge', () => {
        it('should claim badge successfully with GLOBAL_CODE', async () => {
            mockPrismaService.badge.findUnique.mockResolvedValue({
                id: 'b1',
                triggerRule: 'MANUAL',
                manualDeliveryMode: 'GLOBAL_CODE',
                claimCode: 'SECRET-123',
                eventId: 'e1'
            });
            mockPrismaService.userBadge.findUnique.mockResolvedValue(null);
            const result = await service.claimBadge('u1', 'b1', 'SECRET-123');
            expect(result).toBeDefined();
            expect(mockPrismaService.userBadge.create).toHaveBeenCalled();
        });
        it('should throw BadRequestException for invalid global code', async () => {
            mockPrismaService.badge.findUnique.mockResolvedValue({
                id: 'b1',
                triggerRule: 'MANUAL',
                manualDeliveryMode: 'GLOBAL_CODE',
                claimCode: 'CORRECT',
            });
            await expect(service.claimBadge('u1', 'b1', 'WRONG'))
                .rejects.toThrow(common_1.BadRequestException);
        });
        it('should claim badge successfully with UNIQUE_CODES', async () => {
            mockPrismaService.badge.findUnique.mockResolvedValue({
                id: 'b1',
                triggerRule: 'MANUAL',
                manualDeliveryMode: 'UNIQUE_CODES',
                eventId: 'e1'
            });
            mockPrismaService.badgeClaimCode.findFirst.mockResolvedValue({ id: 'c1', isUsed: false });
            mockPrismaService.userBadge.findUnique.mockResolvedValue(null);
            await service.claimBadge('u1', 'b1', 'UNIQ-1');
            expect(mockPrismaService.badgeClaimCode.update).toHaveBeenCalledWith({
                where: { id: 'c1' },
                data: expect.objectContaining({ isUsed: true }),
            });
        });
    });
    describe('awardBadgeByScan', () => {
        it('should award badge when scanning a ticket token', async () => {
            mockPrismaService.badge.findFirst.mockResolvedValue({ id: 'b1', tenantId: 't1', eventId: 'e1' });
            mockPrismaService.ticket.findFirst.mockResolvedValue({
                id: 'tkt1',
                eventId: 'e1',
                registration: { userId: 'u1' }
            });
            mockPrismaService.userBadge.findUnique.mockResolvedValue(null);
            await service.awardBadgeByScan('t1', 'b1', 'TOKEN-XYZ');
            expect(mockPrismaService.userBadge.create).toHaveBeenCalledWith({
                data: { userId: 'u1', badgeId: 'b1', eventId: 'e1' }
            });
        });
    });
});
//# sourceMappingURL=badges.service.spec.js.map