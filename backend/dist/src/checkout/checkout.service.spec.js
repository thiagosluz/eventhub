"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const checkout_service_1 = require("./checkout.service");
const prisma_service_1 = require("../prisma/prisma.service");
const activities_service_1 = require("../activities/activities.service");
const free_ticket_strategy_1 = require("./free-ticket.strategy");
const mail_service_1 = require("../mail/mail.service");
const badges_service_1 = require("../badges/badges.service");
const common_1 = require("@nestjs/common");
describe('CheckoutService', () => {
    let service;
    const mockPrismaService = {
        event: {
            findUnique: jest.fn(),
        },
        registration: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        activity: {
            findMany: jest.fn(),
        },
        activityEnrollment: {
            createMany: jest.fn(),
        },
        customFormResponse: {
            create: jest.fn(),
        },
        customFormAnswer: {
            create: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    };
    const mockActivitiesService = {
        enrollInActivity: jest.fn(),
    };
    const mockFreeTicketStrategy = {
        process: jest.fn(),
    };
    const mockMailService = {
        enqueue: jest.fn(),
    };
    const mockBadgesService = {
        checkAndAwardBadge: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                checkout_service_1.CheckoutService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: activities_service_1.ActivitiesService, useValue: mockActivitiesService },
                { provide: free_ticket_strategy_1.FreeTicketStrategy, useValue: mockFreeTicketStrategy },
                { provide: mail_service_1.MailService, useValue: mockMailService },
                { provide: badges_service_1.BadgesService, useValue: mockBadgesService },
            ],
        }).compile();
        service = module.get(checkout_service_1.CheckoutService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('processCheckout', () => {
        const checkoutInput = {
            eventId: 'event_1',
            userId: 'user_1',
            activityIds: ['activity_1'],
        };
        it('should throw NotFoundException if event not found', async () => {
            mockPrismaService.event.findUnique.mockResolvedValue(null);
            await expect(service.processCheckout(checkoutInput)).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw ConflictException if user already registered', async () => {
            mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event_1' });
            mockPrismaService.registration.findFirst.mockResolvedValue({ id: 'reg_1' });
            await expect(service.processCheckout(checkoutInput)).rejects.toThrow(common_1.ConflictException);
        });
        it('should process checkout successfully', async () => {
            mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event_1', name: 'Test Event' });
            mockPrismaService.registration.findFirst.mockResolvedValue(null);
            mockPrismaService.registration.create.mockResolvedValue({ id: 'reg_new' });
            mockPrismaService.activity.findMany.mockResolvedValue([]);
            mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user_1', email: 'test@example.com' });
            mockFreeTicketStrategy.process.mockResolvedValue({ tickets: [], totalAmount: '0.00' });
            const result = await service.processCheckout(checkoutInput);
            expect(result).toBeDefined();
            expect(result.registrationId).toBe('reg_new');
            expect(mockFreeTicketStrategy.process).toHaveBeenCalled();
            expect(mockMailService.enqueue).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=checkout.service.spec.js.map