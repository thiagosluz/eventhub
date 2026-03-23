"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const tenants_service_1 = require("./tenants.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
describe('TenantsService', () => {
    let service;
    const mockPrismaService = {
        tenant: {
            findUnique: jest.fn(),
            update: jest.fn(),
            findFirst: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                tenants_service_1.TenantsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(tenants_service_1.TenantsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getTenant', () => {
        it('should return a tenant if found', async () => {
            mockPrismaService.tenant.findUnique.mockResolvedValue({ id: 't1', name: 'Tenant 1' });
            const result = await service.getTenant('t1');
            expect(result.id).toBe('t1');
        });
        it('should throw NotFoundException if tenant not found', async () => {
            mockPrismaService.tenant.findUnique.mockResolvedValue(null);
            await expect(service.getTenant('invalid')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('updateTenant', () => {
        it('should update and return the tenant', async () => {
            const dto = { name: 'Updated Name' };
            mockPrismaService.tenant.update.mockResolvedValue({ id: 't1', ...dto });
            const result = await service.updateTenant('t1', dto);
            expect(result.name).toBe('Updated Name');
        });
    });
    describe('getPublicTenant', () => {
        it('should return public info of the first tenant', async () => {
            mockPrismaService.tenant.findFirst.mockResolvedValue({
                name: 'EventHub',
                logoUrl: 'logo.png',
                themeConfig: {}
            });
            const result = await service.getPublicTenant();
            expect(result === null || result === void 0 ? void 0 : result.name).toBe('EventHub');
        });
        it('should return null if no tenant exists', async () => {
            mockPrismaService.tenant.findFirst.mockResolvedValue(null);
            const result = await service.getPublicTenant();
            expect(result).toBeNull();
        });
    });
});
//# sourceMappingURL=tenants.service.spec.js.map