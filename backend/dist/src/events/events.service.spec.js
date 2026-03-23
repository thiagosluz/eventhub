"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const events_service_1 = require("./events.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
describe('EventsService', () => {
    let service;
    const mockPrismaService = {
        event: {
            findFirst: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        registration: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        ticket: {
            findMany: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                events_service_1.EventsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(events_service_1.EventsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('createEvent', () => {
        const createDto = {
            name: 'Test Event',
            slug: 'test-event',
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
        };
        const tenantId = 'tenant_id';
        it('should throw error if slug already exists for tenant', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'existing' });
            await expect(service.createEvent({ tenantId, data: createDto })).rejects.toThrow('Já existe um evento com este slug para a sua organização.');
        });
        it('should create event if data is valid', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue(null);
            mockPrismaService.event.create.mockResolvedValue({ id: 'new_event', ...createDto });
            const result = await service.createEvent({ tenantId, data: createDto });
            expect(result).toBeDefined();
            expect(mockPrismaService.event.create).toHaveBeenCalled();
        });
    });
    describe('findEventById', () => {
        it('should throw NotFoundException if event not found', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue(null);
            await expect(service.findEventById('tenant_id', 'event_id')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should return event if found', async () => {
            const event = { id: 'event_id', name: 'Test Event' };
            mockPrismaService.event.findFirst.mockResolvedValue(event);
            const result = await service.findEventById('tenant_id', 'event_id');
            expect(result).toEqual(event);
        });
    });
});
//# sourceMappingURL=events.service.spec.js.map