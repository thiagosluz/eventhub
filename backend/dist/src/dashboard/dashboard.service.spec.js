"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const dashboard_service_1 = require("./dashboard.service");
const prisma_service_1 = require("../prisma/prisma.service");
describe('DashboardService', () => {
    let service;
    const mockPrismaService = {
        ticket: {
            aggregate: jest.fn(),
            count: jest.fn(),
        },
        registration: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        event: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                dashboard_service_1.DashboardService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(dashboard_service_1.DashboardService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getStats', () => {
        it('should calculate dashboard stats correctly', async () => {
            mockPrismaService.ticket.aggregate.mockResolvedValue({ _sum: { price: 1000 } });
            mockPrismaService.registration.count.mockResolvedValue(50);
            mockPrismaService.event.count.mockResolvedValue(5);
            mockPrismaService.ticket.count.mockResolvedValue(40);
            mockPrismaService.registration.findMany.mockResolvedValue([
                { id: 'r1', createdAt: new Date(), user: { name: 'U1' }, event: { name: 'E1' } },
            ]);
            mockPrismaService.event.findMany.mockResolvedValue([
                { id: 'e1', name: 'E1', updatedAt: new Date(), status: 'PUBLISHED', tickets: [], _count: { registrations: 10 } },
            ]);
            const result = await service.getStats('tenant_1');
            expect(result.totalRevenue).toBe(1000);
            expect(result.totalRegistrations).toBe(50);
            expect(result.activeEvents).toBe(5);
            expect(result.recentActivities).toHaveLength(2);
            expect(result.eventSales).toHaveLength(1);
            expect(result.timeSeriesData).toHaveLength(30);
        });
    });
});
//# sourceMappingURL=dashboard.service.spec.js.map