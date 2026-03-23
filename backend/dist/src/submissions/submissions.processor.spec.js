"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const submissions_processor_1 = require("./submissions.processor");
const prisma_service_1 = require("../prisma/prisma.service");
describe('AssignReviewsProcessor', () => {
    let processor;
    const mockPrismaService = {
        user: {
            findMany: jest.fn(),
        },
        review: {
            findMany: jest.fn(),
            createMany: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                submissions_processor_1.AssignReviewsProcessor,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        processor = module.get(submissions_processor_1.AssignReviewsProcessor);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(processor).toBeDefined();
    });
    describe('process', () => {
        const job = {
            data: {
                submissionId: 'sub_1',
                eventId: 'event_1',
                tenantId: 'tenant_1',
            },
        };
        it('should assign reviewers correctly', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([
                { id: 'rev_1' },
                { id: 'rev_2' },
            ]);
            mockPrismaService.review.findMany.mockResolvedValue([]);
            mockPrismaService.review.createMany.mockResolvedValue({ count: 2 });
            await processor.process(job);
            expect(mockPrismaService.user.findMany).toHaveBeenCalled();
            expect(mockPrismaService.review.createMany).toHaveBeenCalledWith({
                data: [
                    { submissionId: 'sub_1', reviewerId: 'rev_1' },
                    { submissionId: 'sub_1', reviewerId: 'rev_2' },
                ],
            });
        });
        it('should not assign if no reviewers found', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([]);
            await processor.process(job);
            expect(mockPrismaService.review.createMany).not.toHaveBeenCalled();
        });
        it('should not assign if reviews already exist', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([{ id: 'rev_1' }]);
            mockPrismaService.review.findMany.mockResolvedValue([{ id: 'existing_rev' }]);
            await processor.process(job);
            expect(mockPrismaService.review.createMany).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=submissions.processor.spec.js.map