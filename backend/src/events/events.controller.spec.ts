import { Test, TestingModule } from "@nestjs/testing";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { MinioService } from "../storage/minio.service";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
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
    duplicateEvent: jest.fn(),
    listParticipants: jest.fn(),
    findParticipantDetail: jest.fn(),
    findAllPublic: jest.fn(),
    findPublicBySlug: jest.fn(),
    findMyTickets: jest.fn(),
  };

  const mockMinioService = {
    uploadObject: jest.fn(),
  };

  const mockJwtService = {
    decode: jest.fn(),
  };

  const mockPrismaService = {
    eventMonitor: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: mockEventsService },
        { provide: MinioService, useValue: mockMinioService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  describe("createEvent", () => {
    it("should call service.createEvent", async () => {
      const dto = { name: "Event", slug: "slug", startDate: "", endDate: "" };
      const req = { user: { tenantId: "t1" } } as any;
      mockEventsService.createEvent.mockResolvedValue({ id: "1" });
      await controller.createEvent(dto, req);
      expect(service.createEvent).toHaveBeenCalledWith({
        tenantId: "t1",
        data: dto,
      });
    });

    it("should throw BadRequestException if service fails", async () => {
      const dto = { name: "Event", slug: "slug", startDate: "", endDate: "" };
      const req = { user: { tenantId: "t1" } } as any;
      mockEventsService.createEvent.mockRejectedValue(new Error("fail"));
      await expect(controller.createEvent(dto, req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("updateEvent", () => {
    it("should call service.updateEvent", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.updateEvent("e1", { name: "New" }, req);
      expect(service.updateEvent).toHaveBeenCalled();
    });
  });

  describe("duplicateEvent", () => {
    it("should call service.duplicateEvent", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.duplicateEvent("e1", req);
      expect(service.duplicateEvent).toHaveBeenCalledWith("t1", "e1");
    });
  });

  it("should list participants", async () => {
    const req = { user: { tenantId: "t1" } } as any;
    await controller.listParticipants(req, "e1", "search");
    expect(service.listParticipants).toHaveBeenCalled();
  });

  it("should list public events", async () => {
    await controller.listPublicEvents();
    expect(service.findAllPublic).toHaveBeenCalled();
  });
});
