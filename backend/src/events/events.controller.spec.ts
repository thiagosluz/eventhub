import { Test, TestingModule } from "@nestjs/testing";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { MinioService } from "../storage/minio.service";
import { JwtService } from "@nestjs/jwt";
import { BadRequestException } from "@nestjs/common";

describe("EventsController", () => {
  let controller: EventsController;
  let service: EventsService;

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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: mockEventsService },
        { provide: MinioService, useValue: mockMinioService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createEvent", () => {
    it("should call service.createEvent with correct parameters", async () => {
      const dto = { name: "Event", slug: "slug", startDate: "", endDate: "" };
      const req = { user: { tenantId: "tenant_id" } } as any;
      mockEventsService.createEvent.mockResolvedValue({ id: "1" });

      await controller.createEvent(dto, req);

      expect(service.createEvent).toHaveBeenCalledWith({
        tenantId: "tenant_id",
        data: dto,
      });
    });

    it("should throw BadRequestException if service throws slug error", async () => {
      const dto = { name: "Event", slug: "slug", startDate: "", endDate: "" };
      const req = { user: { tenantId: "tenant_id" } } as any;
      mockEventsService.createEvent.mockRejectedValue(new Error("slug error"));

      await expect(controller.createEvent(dto, req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
