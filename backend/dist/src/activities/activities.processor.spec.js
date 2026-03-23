"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const activities_processor_1 = require("./activities.processor");
const prisma_service_1 = require("../prisma/prisma.service");
const prisma_1 = require("../generated/prisma");
describe('ActivitiesProcessor', () => {
    let processor;
    const mockPrismaService = {
        activity: {
            findMany: jest.fn(),
        },
        activityEnrollment: {
            findMany: jest.fn(),
            updateMany: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                activities_processor_1.ActivitiesProcessor,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        processor = module.get(activities_processor_1.ActivitiesProcessor);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(processor).toBeDefined();
    });
    describe('cleanupExpiredEnrollments', () => {
        it('should cancel expired pending enrollments', async () => {
            const activity = { id: 'a1', title: 'Act', requiresConfirmation: true, confirmationDays: 1 };
            mockPrismaService.activity.findMany.mockResolvedValue([activity]);
            const expiredEnrollment = { id: 'e1', status: prisma_1.EnrollmentStatus.PENDING };
            mockPrismaService.activityEnrollment.findMany.mockResolvedValue([expiredEnrollment]);
            await processor.cleanupExpiredEnrollments();
            expect(mockPrismaService.activityEnrollment.updateMany).toHaveBeenCalledWith({
                where: { id: { in: ['e1'] } },
                data: { status: prisma_1.EnrollmentStatus.CANCELLED },
            });
        });
        it('should do nothing if no expired enrollments found', async () => {
            mockPrismaService.activity.findMany.mockResolvedValue([]);
            await processor.cleanupExpiredEnrollments();
            expect(mockPrismaService.activityEnrollment.updateMany).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=activities.processor.spec.js.map