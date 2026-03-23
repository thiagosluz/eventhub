"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const sponsors_service_1 = require("./sponsors.service");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../storage/minio.service");
const common_1 = require("@nestjs/common");
describe('SponsorsService', () => {
    let service;
    const mockPrismaService = {
        event: {
            findFirst: jest.fn(),
        },
        sponsorCategory: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        sponsor: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };
    const mockMinioService = {
        uploadObject: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                sponsors_service_1.SponsorsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: minio_service_1.MinioService, useValue: mockMinioService },
            ],
        }).compile();
        service = module.get(sponsors_service_1.SponsorsService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('createCategory', () => {
        it('should create a sponsor category', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrismaService.sponsorCategory.create.mockResolvedValue({ id: 'c1', name: 'Gold' });
            const result = await service.createCategory('t1', 'e1', { name: 'Gold' });
            expect(result.name).toBe('Gold');
        });
        it('should throw NotFound if event not in tenant', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue(null);
            await expect(service.createCategory('t1', 'e1', { name: 'Gold' }))
                .rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('createSponsor', () => {
        it('should create a sponsor in a category', async () => {
            mockPrismaService.sponsorCategory.findUnique.mockResolvedValue({ id: 'c1', event: { tenantId: 't1' } });
            mockPrismaService.sponsor.create.mockResolvedValue({ id: 'sp1', name: 'Google' });
            const result = await service.createSponsor('t1', { categoryId: 'c1', name: 'Google' });
            expect(result.name).toBe('Google');
        });
    });
});
//# sourceMappingURL=sponsors.service.spec.js.map