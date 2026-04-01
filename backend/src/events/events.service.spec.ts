import { Test, TestingModule } from "@nestjs/testing";
import { EventsService } from "./events.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("EventsService", () => {
  let service: EventsService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createEvent", () => {
    const createDto = {
      name: "Test Event",
      slug: "test-event",
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    };
    const tenantId = "tenant_id";

    it("should throw error if slug already exists for tenant", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "existing" });

      await expect(
        service.createEvent({ tenantId, data: createDto }),
      ).rejects.toThrow(
        "Já existe um evento com este slug para a sua organização.",
      );
    });

    it("should throw error if dates are invalid", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(
        service.createEvent({
          tenantId,
          data: { ...createDto, startDate: "invalid" },
        }),
      ).rejects.toThrow("As datas de início e término devem ser válidas.");
    });
  });

  describe("findEventById", () => {
    it("should throw NotFoundException if event not found", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);

      await expect(
        service.findEventById("tenant_id", "event_id"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should return event if found", async () => {
      const event = { id: "event_id", name: "Test Event" };
      mockPrismaService.event.findFirst.mockResolvedValue(event);

      const result = await service.findEventById("tenant_id", "event_id");

      expect(result).toEqual(event);
    });
  });

  describe("updateEvent", () => {
    it("should throw for invalid start date", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      await expect(
        service.updateEvent({
          tenantId: "t1",
          eventId: "e1",
          data: { startDate: "invalid" },
        }),
      ).rejects.toThrow("Data de início inválida");
    });

    it("should throw for invalid end date", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      await expect(
        service.updateEvent({
          tenantId: "t1",
          eventId: "e1",
          data: { endDate: "invalid" },
        }),
      ).rejects.toThrow("Data de término inválida");
    });

    it("should update event if owner", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.event.update.mockResolvedValue({
        id: "e1",
        name: "Upd",
      });

      const result = await service.updateEvent({
        tenantId: "t1",
        eventId: "e1",
        data: { name: "Upd" },
      });
      expect(result.name).toBe("Upd");
    });

    it("should throw NotFound if event not in tenant", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(
        service.updateEvent({ tenantId: "t1", eventId: "e1", data: {} }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("listParticipants", () => {
    it("should list participants for tenant", async () => {
      mockPrismaService.registration.findMany.mockResolvedValue([{ id: "r1" }]);
      const result = await service.listParticipants("t1", {
        eventId: "e1",
        search: "foo",
        status: "CONFIRMED",
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("deleteEvent", () => {
    it("should delete event if in DRAFT", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({
        id: "e1",
        status: "DRAFT",
      });
      mockPrismaService.event.delete.mockResolvedValue({ id: "e1" });
      await service.deleteEvent("t1", "e1");
      expect(mockPrismaService.event.delete).toHaveBeenCalled();
    });

    it("should throw if not in DRAFT", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({
        id: "e1",
        status: "PUBLISHED",
      });
      await expect(service.deleteEvent("t1", "e1")).rejects.toThrow(
        "Apenas eventos em rascunho podem ser excluídos.",
      );
    });

    it("should throw NotFound if event missing", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(service.deleteEvent("t1", "e1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("Participant Detail & Tickets", () => {
    it("should return my tickets list", async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([{ id: "t1" }]);
      const result = await service.findMyTickets("u1");
      expect(result).toHaveLength(1);
    });

    it("should return participant detail and history", async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue({
        id: "r1",
        userId: "u1",
        event: { tenantId: "t1" },
        enrollments: [{ activity: { type: { name: "Workshop" } } }],
      });
      mockPrismaService.registration.findMany.mockResolvedValue([
        { id: "r_old", event: { name: "Old" } },
      ]);
      const result = await service.findParticipantDetail("t1", "r1");
      expect(result.history).toHaveLength(1);
    });

    it("should throw NotFound if registration missing or wrong tenant", async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(null);
      await expect(
        service.findParticipantDetail("t1", "r1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("Public Events", () => {
    it("should list all published events", async () => {
      mockPrismaService.event.findMany.mockResolvedValue([{ id: "e1" }]);
      const result = await service.findAllPublic();
      expect(result).toHaveLength(1);
    });

    it("should find public event by slug", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({
        id: "e1",
        slug: "s",
      });
      const result = await service.findPublicBySlug("s", "t1");
      expect(result.id).toBe("e1");
    });

    it("should throw NotFound if public event slug doesn't exist", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(service.findPublicBySlug("s")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
