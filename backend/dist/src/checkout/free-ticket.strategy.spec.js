"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const free_ticket_strategy_1 = require("./free-ticket.strategy");
const prisma_service_1 = require("../prisma/prisma.service");
describe('FreeTicketStrategy', () => {
    let strategy;
    const mockPrismaService = {
        ticket: {
            create: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                free_ticket_strategy_1.FreeTicketStrategy,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        strategy = module.get(free_ticket_strategy_1.FreeTicketStrategy);
    });
    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });
    describe('process', () => {
        const context = {
            userId: 'user_1',
            eventId: 'event_1',
            registrationId: 'reg_1',
            activityIds: ['act_1'],
        };
        it('should create tickets for event and activities', async () => {
            mockPrismaService.ticket.create.mockImplementation((args) => ({
                id: 'ticket_' + Math.random(),
                ...args.data,
            }));
            const result = await strategy.process(context);
            expect(result.tickets).toHaveLength(2);
            expect(result.totalAmount).toBe('0.00');
            expect(mockPrismaService.ticket.create).toHaveBeenCalledTimes(2);
        });
    });
});
//# sourceMappingURL=free-ticket.strategy.spec.js.map