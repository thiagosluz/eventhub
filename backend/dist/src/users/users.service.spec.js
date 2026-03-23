"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const users_service_1 = require("./users.service");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../storage/minio.service");
const badges_service_1 = require("../badges/badges.service");
const common_1 = require("@nestjs/common");
describe('UsersService', () => {
    let service;
    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
        },
        speaker: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };
    const mockMinioService = {
        uploadObject: jest.fn(),
    };
    const mockBadgesService = {
        checkAndAwardBadge: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                users_service_1.UsersService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: minio_service_1.MinioService, useValue: mockMinioService },
                { provide: badges_service_1.BadgesService, useValue: mockBadgesService },
            ],
        }).compile();
        service = module.get(users_service_1.UsersService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('findMe', () => {
        it('should return user info', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1', name: 'User' });
            const result = await service.findMe('u1');
            expect(result.name).toBe('User');
        });
        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            await expect(service.findMe('u1')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('updateProfile', () => {
        it('should throw ConflictException if email in use', async () => {
            mockPrismaService.user.findFirst.mockResolvedValue({ id: 'u2' });
            await expect(service.updateProfile('u1', { email: 'used@test.com' }))
                .rejects.toThrow(common_1.ConflictException);
        });
        it('should update profile and sync to speaker', async () => {
            mockPrismaService.user.findFirst.mockResolvedValue(null);
            mockPrismaService.user.update.mockResolvedValue({ id: 'u1', name: 'New Name' });
            mockPrismaService.speaker.findUnique.mockResolvedValue({ id: 's1' });
            const result = await service.updateProfile('u1', { name: 'New Name' });
            expect(result.name).toBe('New Name');
            expect(mockPrismaService.speaker.update).toHaveBeenCalled();
            expect(mockBadgesService.checkAndAwardBadge).toHaveBeenCalledWith('u1', null, 'PROFILE_COMPLETED');
        });
    });
    describe('findAll', () => {
        it('should list users for a tenant or with registrations in the tenant', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([{ id: 'u1' }]);
            const result = await service.findAll('t1');
            expect(result).toHaveLength(1);
        });
    });
});
//# sourceMappingURL=users.service.spec.js.map