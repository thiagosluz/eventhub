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

    it("should throw BadRequestException if update fails", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      mockEventsService.updateEvent.mockRejectedValueOnce(
        new Error("fail update"),
      );
      await expect(
        controller.updateEvent("e1", { name: "New" }, req),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw error if missing tenantId", async () => {
      await expect(
        controller.updateEvent("e1", {}, { user: {} } as any),
      ).rejects.toThrow("Missing tenantId on token payload.");
    });
  });

  describe("duplicateEvent", () => {
    it("should call service.duplicateEvent", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.duplicateEvent("e1", req);
      expect(service.duplicateEvent).toHaveBeenCalledWith("t1", "e1");
    });

    it("should throw BadRequestException if duplication fails", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      mockEventsService.duplicateEvent.mockRejectedValueOnce(
        new Error("fail dup"),
      );
      await expect(controller.duplicateEvent("e1", req)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw error if missing tenantId", async () => {
      await expect(
        controller.duplicateEvent("e1", { user: {} } as any),
      ).rejects.toThrow("Missing tenantId on token payload.");
    });
  });

  describe("listEvents", () => {
    it("should list events for tenant", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.listEvents(req);
      expect(service.listEventsForTenant).toHaveBeenCalledWith("t1");
    });

    it("should throw if missing tenantId", async () => {
      await expect(controller.listEvents({ user: {} } as any)).rejects.toThrow(
        "Missing tenantId",
      );
    });
  });

  describe("getEvent", () => {
    it("should get specific event", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.getEvent("e1", req);
      expect(service.findEventById).toHaveBeenCalledWith("t1", "e1");
    });

    it("should throw if missing tenantId", async () => {
      await expect(
        controller.getEvent("e1", { user: {} } as any),
      ).rejects.toThrow("Missing tenantId");
    });
  });

  describe("deleteEvent", () => {
    it("should call delete event", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.deleteEvent("e1", req);
      expect(service.deleteEvent).toHaveBeenCalledWith("t1", "e1");
    });

    it("should throw if missing tenantId", async () => {
      await expect(
        controller.deleteEvent("e1", { user: {} } as any),
      ).rejects.toThrow("Missing tenantId");
    });
  });

  describe("Participants & Export", () => {
    it("should export participants to csv", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;
      mockEventsService.listParticipants.mockResolvedValue([
        {
          user: { name: "John", email: "j@j.com" },
          event: { name: "E1" },
          tickets: [{ type: "VIP" }],
          createdAt: new Date(),
        },
      ]);

      await controller.exportParticipants(req, res, "e1", "john");
      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv");
      expect(res.send).toHaveBeenCalled();
    });

    it("should throw if missing tenantId on export", async () => {
      await expect(
        controller.exportParticipants({ user: {} } as any, {} as any),
      ).rejects.toThrow("Tenant missing");
    });

    it("should throw if missing tenantId on getParticipantDetail", async () => {
      await expect(
        controller.getParticipantDetail({ user: {} } as any, "p1"),
      ).rejects.toThrow("Tenant missing");
    });

    it("should list participants", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      await controller.listParticipants(req, "e1", "search");
      expect(service.listParticipants).toHaveBeenCalled();
    });

    it("should throw if missing tenantId on listParticipants", async () => {
      await expect(
        controller.listParticipants({ user: {} } as any),
      ).rejects.toThrow("Tenant missing");
    });
  });

  describe("Uploads", () => {
    it("should upload banner", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      const file = { buffer: Buffer.from("test"), mimetype: "image/png" };
      mockMinioService.uploadObject.mockResolvedValue("http://banner.png");

      await controller.uploadBanner("e1", file, req);
      expect(mockMinioService.uploadObject).toHaveBeenCalled();
      expect(service.updateEvent).toHaveBeenCalledWith({
        tenantId: "t1",
        eventId: "e1",
        data: { bannerUrl: "http://banner.png" },
      });
    });

    it("should throw missing tenantId on banner", async () => {
      await expect(
        controller.uploadBanner("e1", {}, { user: {} } as any),
      ).rejects.toThrow("Missing tenantId");
    });

    it("should upload logo", async () => {
      const req = { user: { tenantId: "t1" } } as any;
      const file = { buffer: Buffer.from("test"), mimetype: "image/png" };
      mockMinioService.uploadObject.mockResolvedValue("http://logo.png");

      await controller.uploadLogo("e1", file, req);
      expect(mockMinioService.uploadObject).toHaveBeenCalled();
    });

    it("should throw missing tenantId on logo", async () => {
      await expect(
        controller.uploadLogo("e1", {}, { user: {} } as any),
      ).rejects.toThrow("Missing tenantId");
    });
  });

  describe("Public and User Tickets", () => {
    it("should list public events", async () => {
      await controller.listPublicEvents();
      expect(service.findAllPublic).toHaveBeenCalled();
    });

    it("should get public event by slug without auth", async () => {
      const req = { headers: {} } as any;
      await controller.getPublicEvent("slug", req);
      expect(service.findPublicBySlug).toHaveBeenCalledWith("slug", undefined);
    });

    it("should get public event by slug with decoded auth", async () => {
      const req = { headers: { authorization: "Bearer some-token" } } as any;
      mockJwtService.decode.mockReturnValue({ tenantId: "t1" });
      await controller.getPublicEvent("slug", req);
      expect(service.findPublicBySlug).toHaveBeenCalledWith("slug", "t1");
    });

    it("should ignore invalid tokens on public slug", async () => {
      const req = { headers: { authorization: "Bearer invalid" } } as any;
      mockJwtService.decode.mockImplementation(() => {
        throw new Error();
      });
      await controller.getPublicEvent("slug", req);
      expect(service.findPublicBySlug).toHaveBeenCalledWith("slug", undefined);
    });

    it("should return my-tickets", async () => {
      const req = { user: { sub: "u1" } } as any;
      await controller.getMyTickets(req);
      expect(service.findMyTickets).toHaveBeenCalledWith("u1");
    });

    it("should throw missing user id on my-tickets", async () => {
      await expect(
        controller.getMyTickets({ user: {} } as any),
      ).rejects.toThrow("Missing user id");
    });
  });
});
