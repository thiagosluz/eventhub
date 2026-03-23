"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const analytics_service_1 = require("./analytics.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
describe('AnalyticsService', () => {
    let service;
    const mockPrismaService = {
        event: {
            findFirst: jest.fn(),
        },
        registration: {
            findMany: jest.fn(),
        },
        attendance: {
            findMany: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                analytics_service_1.AnalyticsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(analytics_service_1.AnalyticsService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getEventAnalytics', () => {
        it('should calculate correct metrics for an event', async () => {
            const mockEvent = {
                id: 'e1',
                name: 'Conference 2026',
                activities: [
                    {
                        id: 'a1',
                        title: 'Keynote',
                        type: { name: 'Main' },
                        capacity: 100,
                        enrollments: [{}, {}, {}],
                        attendances: [{}, {}],
                    },
                ],
                registrations: [
                    {
                        id: 'r1',
                        createdAt: new Date(),
                        tickets: [{ status: 'COMPLETED', type: 'VIP', attendances: [] }],
                    },
                ],
            };
            mockPrismaService.event.findFirst.mockResolvedValue(mockEvent);
            const result = await service.getEventAnalytics('t1', 'e1');
            expect(result.eventId).toBe('e1');
            expect(result.totalRegistrations).toBe(1);
            expect(result.activityParticipation[0].enrolled).toBe(3);
            expect(result.activityParticipation[0].attended).toBe(2);
            expect(result.activityParticipation[0].occupancyRate).toBe(3);
            expect(result.registrationStatus).toContainEqual({ name: 'COMPLETED', value: 1 });
            expect(result.ticketDistribution).toContainEqual({ name: 'VIP', value: 1 });
        });
        it('should throw NotFoundException if event is not found', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue(null);
            await expect(service.getEventAnalytics('t1', 'e999'))
                .rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('getEventParticipants', () => {
        it('should map registrations to participant list', async () => {
            mockPrismaService.registration.findMany.mockResolvedValue([
                {
                    id: 'r1',
                    userId: 'u1',
                    createdAt: new Date(),
                    user: { name: 'Thiago', email: 'thiago@test.com' },
                    tickets: [{ type: 'REGULAR', status: 'COMPLETED', qrCodeToken: 'T123', attendances: [] }],
                    enrollments: [{}],
                },
            ]);
            const result = await service.getEventParticipants('t1', 'e1');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Thiago');
            expect(result[0].enrollmentsCount).toBe(1);
        });
    });
    describe('getEventCheckins', () => {
        it('should return checkin list', async () => {
            mockPrismaService.attendance.findMany.mockResolvedValue([
                {
                    id: 'att1',
                    checkedAt: new Date(),
                    activity: { title: 'Workshop' },
                    ticket: {
                        type: 'VIP',
                        registration: {
                            user: { name: 'Alice', email: 'alice@test.com' },
                        },
                    },
                },
            ]);
            const result = await service.getEventCheckins('t1', 'e1', 'a1');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Alice');
            expect(result[0].activityName).toBe('Workshop');
        });
    });
});
//# sourceMappingURL=analytics.service.spec.js.map