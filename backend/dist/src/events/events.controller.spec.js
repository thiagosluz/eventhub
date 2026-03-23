"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const events_controller_1 = require("./events.controller");
const events_service_1 = require("./events.service");
const minio_service_1 = require("../storage/minio.service");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
describe('EventsController', () => {
    let controller;
    let service;
    const mockEventsService = {
        createEvent: jest.fn(),
        listEventsForTenant: jest.fn(),
        findEventById: jest.fn(),
        updateEvent: jest.fn(),
        deleteEvent: jest.fn(),
    };
    const mockMinioService = {
        uploadObject: jest.fn(),
    };
    const mockJwtService = {
        decode: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [events_controller_1.EventsController],
            providers: [
                { provide: events_service_1.EventsService, useValue: mockEventsService },
                { provide: minio_service_1.MinioService, useValue: mockMinioService },
                { provide: jwt_1.JwtService, useValue: mockJwtService },
            ],
        }).compile();
        controller = module.get(events_controller_1.EventsController);
        service = module.get(events_service_1.EventsService);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    describe('createEvent', () => {
        it('should call service.createEvent with correct parameters', async () => {
            const dto = { name: 'Event', slug: 'slug', startDate: '', endDate: '' };
            const req = { user: { tenantId: 'tenant_id' } };
            mockEventsService.createEvent.mockResolvedValue({ id: '1' });
            await controller.createEvent(dto, req);
            expect(service.createEvent).toHaveBeenCalledWith({
                tenantId: 'tenant_id',
                data: dto,
            });
        });
        it('should throw BadRequestException if service throws slug error', async () => {
            const dto = { name: 'Event', slug: 'slug', startDate: '', endDate: '' };
            const req = { user: { tenantId: 'tenant_id' } };
            mockEventsService.createEvent.mockRejectedValue(new Error('slug error'));
            await expect(controller.createEvent(dto, req)).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
//# sourceMappingURL=events.controller.spec.js.map