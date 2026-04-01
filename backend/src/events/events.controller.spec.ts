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
    eventMonitor: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
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

    it("should throw error if tenantId missing", async () => {
      await expect(
        controller.createEvent({} as any, { user: {} } as any),
      ).rejects.toThrow("Missing tenantId on token payload.");
    });
  });

  describe("listEvents", () => {
    it("should call service.listEventsForTenant", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.listEvents(req);
      expect(service.listEventsForTenant).toHaveBeenCalledWith("t1");
    });
  });

  describe("getEvent", () => {
    it("should call service.findEventById", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.getEvent("e1", req);
      expect(service.findEventById).toHaveBeenCalledWith("t1", "e1");
    });
  });

  describe("updateEvent", () => {
    it("should call service.updateEvent", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      const dto = { name: "New" };
      await controller.updateEvent("e1", dto, req);
      expect(service.updateEvent).toHaveBeenCalledWith({
        tenantId: "t1",
        eventId: "e1",
        data: dto,
      });
    });
  });

  describe("deleteEvent", () => {
    it("should call service.deleteEvent", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.deleteEvent("e1", req);
      expect(service.deleteEvent).toHaveBeenCalledWith("t1", "e1");
    });
  });

  describe("Participants & Export", () => {
    it("should export participants as CSV", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;
      mockEventsService.listParticipants.mockResolvedValue([
        {
          user: { name: "User1", email: "u1@t.com" },
          event: { name: "Event1" },
          tickets: [{ type: "VIP" }],
          createdAt: new Date().toISOString(),
        },
      ]);

      await controller.exportParticipants(req, res, "e1", "search");

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
      expect(res.send).toHaveBeenCalled();
      const csvContent = res.send.mock.calls[0][0];
      expect(csvContent).toContain("User1");
      expect(csvContent).toContain("VIP");
    });

    it("should get participant detail", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.getParticipantDetail(req, "p1");
      expect(service.findParticipantDetail).toHaveBeenCalledWith("t1", "p1");
    });

    it("should list participants", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.listParticipants(req, "e1", "search");
      expect(service.listParticipants).toHaveBeenCalledWith("t1", {
        eventId: "e1",
        search: "search",
      });
    });
  });

  describe("Media Upload", () => {
    it("should upload banner", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      const file = { buffer: Buffer.from(""), mimetype: "image/png" };
      mockMinioService.uploadObject.mockResolvedValue("url_banner");

      await controller.uploadBanner("e1", file, req);

      expect(mockMinioService.uploadObject).toHaveBeenCalled();
      expect(service.updateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { bannerUrl: "url_banner" },
        }),
      );
    });

    it("should upload logo", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      const file = { buffer: Buffer.from(""), mimetype: "image/png" };
      mockMinioService.uploadObject.mockResolvedValue("url_logo");

      await controller.uploadLogo("e1", file, req);

      expect(mockMinioService.uploadObject).toHaveBeenCalled();
      expect(service.updateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { logoUrl: "url_logo" },
        }),
      );
    });
  });

  describe("Public Routes", () => {
    it("should list public events", async () => {
      await controller.listPublicEvents();
      expect(service.findAllPublic).toHaveBeenCalled();
    });

    it("should get public event by slug with optional token", async () => {
      const req = { headers: { authorization: "Bearer token" } } as any;
      mockJwtService.decode.mockReturnValue({ tenantId: "t1" });

      await controller.getPublicEvent("slug1", req);

      expect(service.findPublicBySlug).toHaveBeenCalledWith("slug1", "t1");
    });

    it("should get public event even without valid token", async () => {
      const req = { headers: {} } as any;
      await controller.getPublicEvent("slug1", req);
      expect(service.findPublicBySlug).toHaveBeenCalledWith("slug1", undefined);
    });
  });

  describe("My Tickets", () => {
    it("should call service.findMyTickets", async () => {
      const req = { user: { sub: "u1" } } as any;
      await controller.getMyTickets(req);
      expect(service.findMyTickets).toHaveBeenCalledWith("u1");
    });
  });
});
