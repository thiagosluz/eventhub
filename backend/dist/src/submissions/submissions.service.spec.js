"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const submissions_service_1 = require("./submissions.service");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../storage/minio.service");
const mail_service_1 = require("../mail/mail.service");
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
describe('SubmissionsService', () => {
    let service;
    const mockPrismaService = {
        event: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
        submission: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        review: {
            findFirst: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
        },
    };
    const mockMinioService = {
        uploadObject: jest.fn(),
    };
    const mockMailService = {
        enqueue: jest.fn(),
    };
    const mockQueue = {
        add: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                submissions_service_1.SubmissionsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: minio_service_1.MinioService, useValue: mockMinioService },
                { provide: mail_service_1.MailService, useValue: mockMailService },
                { provide: (0, bullmq_1.getQueueToken)('assign-reviews'), useValue: mockQueue },
            ],
        }).compile();
        service = module.get(submissions_service_1.SubmissionsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('createSubmission', () => {
        const params = {
            authorId: 'user_1',
            eventId: 'event_1',
            title: 'Title',
            abstract: 'Abstract',
            file: { buffer: Buffer.from('test'), mimetype: 'application/pdf' },
        };
        it('should throw NotFoundException if event not found', async () => {
            mockPrismaService.event.findUnique.mockResolvedValue(null);
            await expect(service.createSubmission(params)).rejects.toThrow(common_1.NotFoundException);
        });
        it('should create submission successfully', async () => {
            mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event_1', tenantId: 'tenant_1' });
            mockMinioService.uploadObject.mockResolvedValue('file_url');
            mockPrismaService.submission.create.mockResolvedValue({
                id: 'sub_1',
                title: 'Title',
                author: { name: 'Author', email: 'author@test.com' },
                event: { name: 'Event' },
            });
            const result = await service.createSubmission(params);
            expect(result).toBeDefined();
            expect(mockMinioService.uploadObject).toHaveBeenCalled();
            expect(mockPrismaService.submission.create).toHaveBeenCalled();
            expect(mockMailService.enqueue).toHaveBeenCalled();
            expect(mockQueue.add).toHaveBeenCalledWith('assign', expect.anything());
        });
    });
    describe('listSubmissionsForEvent', () => {
        it('should throw ForbiddenException if event does not belong to tenant', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue(null);
            await expect(service.listSubmissionsForEvent('tenant_1', 'event_1')).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should list submissions successfully', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'event_1' });
            mockPrismaService.submission.findMany.mockResolvedValue([
                { id: 'sub_1', title: 'Sub 1', reviews: [] },
            ]);
            const result = await service.listSubmissionsForEvent('tenant_1', 'event_1');
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Sub 1');
        });
    });
    describe('submitReview', () => {
        it('should throw ForbiddenException if reviewer not assigned', async () => {
            mockPrismaService.review.findFirst.mockResolvedValue(null);
            await expect(service.submitReview({ reviewerId: 'rev_1', submissionId: 'sub_1' })).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should update review successfully', async () => {
            mockPrismaService.review.findFirst.mockResolvedValue({ id: 'rev_rec_1' });
            mockPrismaService.review.update.mockResolvedValue({ id: 'rev_rec_1', score: 5 });
            const result = await service.submitReview({
                reviewerId: 'rev_1',
                submissionId: 'sub_1',
                score: 5,
                recommendation: 'ACCEPT',
            });
            expect(result.score).toBe(5);
            expect(mockPrismaService.review.update).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=submissions.service.spec.js.map