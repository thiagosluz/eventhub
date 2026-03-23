"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const certificate_pdf_service_1 = require("./certificate-pdf.service");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../storage/minio.service");
const common_1 = require("@nestjs/common");
const validPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    arrayBuffer: () => Promise.resolve(new Uint8Array(validPngBuffer).buffer),
}));
describe('CertificatePdfService', () => {
    let service;
    const mockPrismaService = {
        certificateTemplate: {
            findFirst: jest.fn(),
        },
        registration: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
        },
        attendance: {
            findMany: jest.fn(),
        },
        issuedCertificate: {
            create: jest.fn(),
        },
    };
    const mockMinioService = {
        uploadObject: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                certificate_pdf_service_1.CertificatePdfService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: minio_service_1.MinioService, useValue: mockMinioService },
            ],
        }).compile();
        service = module.get(certificate_pdf_service_1.CertificatePdfService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('generateAndStore', () => {
        it('should throw NotFoundException if template not found', async () => {
            mockPrismaService.certificateTemplate.findFirst.mockResolvedValue(null);
            await expect(service.generateAndStore('tmpl_1', 'reg_1')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should generate and store certificate successfully', async () => {
            mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
                id: 'tmpl_1',
                eventId: 'event_1',
                backgroundUrl: 'http://test.com/bg.png',
                layoutConfig: { placeholders: [] },
                event: { name: 'Test Event' },
            });
            mockPrismaService.registration.findFirst.mockResolvedValue({
                id: 'reg_1',
                user: { name: 'User 1' },
                event: { name: 'Test Event' },
            });
            mockPrismaService.attendance.findMany.mockResolvedValue([]);
            mockMinioService.uploadObject.mockResolvedValue('http://minio/cert.pdf');
            mockPrismaService.issuedCertificate.create.mockResolvedValue({ id: 'issued_1' });
            const result = await service.generateAndStore('tmpl_1', 'reg_1');
            expect(result.fileUrl).toBe('http://minio/cert.pdf');
            expect(mockMinioService.uploadObject).toHaveBeenCalled();
            expect(mockPrismaService.issuedCertificate.create).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=certificate-pdf.service.spec.js.map