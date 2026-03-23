"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const certificate_templates_service_1 = require("./certificate-templates.service");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../storage/minio.service");
const common_1 = require("@nestjs/common");
describe('CertificateTemplatesService', () => {
    let service;
    const mockPrismaService = {
        event: {
            findFirst: jest.fn(),
        },
        certificateTemplate: {
            findMany: jest.fn(),
            create: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
    };
    const mockMinioService = {
        uploadObject: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                certificate_templates_service_1.CertificateTemplatesService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: minio_service_1.MinioService, useValue: mockMinioService },
            ],
        }).compile();
        service = module.get(certificate_templates_service_1.CertificateTemplatesService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        it('should throw ForbiddenException if event not in tenant', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue(null);
            await expect(service.create('tenant_1', 'event_1', { name: 'T1', backgroundUrl: 'url', layoutConfig: {} }))
                .rejects.toThrow(common_1.ForbiddenException);
        });
        it('should create template successfully', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'event_1' });
            mockPrismaService.certificateTemplate.create.mockResolvedValue({ id: 'tmpl_1' });
            const result = await service.create('tenant_1', 'event_1', { name: 'T1', backgroundUrl: 'url', layoutConfig: {} });
            expect(result.id).toBe('tmpl_1');
        });
    });
    describe('findOne', () => {
        it('should throw NotFoundException if template not found', async () => {
            mockPrismaService.certificateTemplate.findFirst.mockResolvedValue(null);
            await expect(service.findOne('tenant_1', 'tmpl_1')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should return template successfully', async () => {
            mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({ id: 'tmpl_1' });
            const result = await service.findOne('tenant_1', 'tmpl_1');
            expect(result.id).toBe('tmpl_1');
        });
    });
});
//# sourceMappingURL=certificate-templates.service.spec.js.map