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

  describe("duplicateEvent", () => {
    it("should throw NotFound if original event missing", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(service.duplicateEvent("t1", "e1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should duplicate and handle slug collision", async () => {
      const original = {
        id: "e1",
        name: "O",
        slug: "s",
        tenantId: "t1",
        themeConfig: {},
      };
      mockPrismaService.event.findFirst
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce({ id: "e2" }) // collision
        .mockResolvedValueOnce(null); // free

      mockPrismaService.event.create.mockResolvedValue({
        id: "enew",
        slug: "s-copy-1",
      });
      const result = await service.duplicateEvent("t1", "e1");
      expect(result.slug).toBe("s-copy-1");
    });
  });

  describe("listParticipants", () => {
    it("should search participants", async () => {
      mockPrismaService.registration.findMany.mockResolvedValue([]);
      await service.listParticipants("t1", { search: "foo" });
      expect(mockPrismaService.registration.findMany).toHaveBeenCalled();
    });
  });
  describe("createEvent", () => {
    it("should throw if slug already exists", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce({ id: "e1" });
      await expect(
        service.createEvent({
          tenantId: "t1",
          data: {
            name: "E",
            slug: "s",
            startDate: "2024-01-01",
            endDate: "2024-01-02",
          },
        }),
      ).rejects.toThrow(
        "Já existe um evento com este slug para a sua organização.",
      );
    });

    it("should throw if invalid dates provided", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce(null);
      await expect(
        service.createEvent({
          tenantId: "t1",
          data: {
            name: "E",
            slug: "s",
            startDate: "invalid-date",
            endDate: "2024-01-02",
          },
        }),
      ).rejects.toThrow("As datas de início e término devem ser válidas.");
    });

    it("should create event successfully", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.event.create.mockResolvedValue({ id: "1" });
      await service.createEvent({
        tenantId: "t1",
        data: {
          name: "E",
          slug: "s",
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
      });
      expect(mockPrismaService.event.create).toHaveBeenCalled();
    });
  });

  describe("listEventsForTenant", () => {
    it("should list events", async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);
      const result = await service.listEventsForTenant("t1");
      expect(result).toEqual([]);
      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: { tenantId: "t1" },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { registrations: true } } },
      });
    });
  });

  describe("findEventById", () => {
    it("should throw NotFoundException if event does not exist", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce(null);
      await expect(service.findEventById("t1", "e1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return event if it exists", async () => {
      const mockEvent = { id: "e1" };
      mockPrismaService.event.findFirst.mockResolvedValueOnce(mockEvent);
      const result = await service.findEventById("t1", "e1");
      expect(result).toEqual(mockEvent);
    });
  });

  describe("updateEvent", () => {
    it("should throw NotFound if event not found", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce(null);
      await expect(
        service.updateEvent({ tenantId: "t1", eventId: "e1", data: {} }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw if updating with invalid startDate", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce({ id: "e1" });
      await expect(
        service.updateEvent({
          tenantId: "t1",
          eventId: "e1",
          data: { startDate: "invalid-date" },
        }),
      ).rejects.toThrow("Data de início inválida");
    });

    it("should throw if updating with invalid endDate", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce({ id: "e1" });
      await expect(
        service.updateEvent({
          tenantId: "t1",
          eventId: "e1",
          data: { endDate: "invalid-date" },
        }),
      ).rejects.toThrow("Data de término inválida");
    });

    it("should update successfully with valid data", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce({ id: "e1" });
      mockPrismaService.event.update.mockResolvedValueOnce({ id: "e1" });
      await service.updateEvent({
        tenantId: "t1",
        eventId: "e1",
        data: {
          name: "Updated",
          startDate: "2024-01-01",
          endDate: "2024-01-02",
        },
      });
      expect(mockPrismaService.event.update).toHaveBeenCalled();
    });
  });

  describe("findAllPublic", () => {
    it("should list published events", async () => {
      mockPrismaService.event.findMany.mockResolvedValue([{ id: "e1" }]);
      const result = await service.findAllPublic();
      expect(result.length).toBe(1);
    });
  });

  describe("findPublicBySlug", () => {
    it("should throw NotFound if slug not found", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce(null);
      await expect(service.findPublicBySlug("s")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should find by slug with organizerTenantId option", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce({ id: "e1" });
      const result = await service.findPublicBySlug("s", "t1");
      expect(result.id).toBe("e1");
    });
  });

  describe("findMyTickets", () => {
    it("should find tickets for user", async () => {
      mockPrismaService.ticket.findMany.mockResolvedValue([{ id: "t1" }]);
      const result = await service.findMyTickets("user1");
      expect(result.length).toBe(1);
    });
  });

  describe("findParticipantDetail", () => {
    it("should throw NotFound if registration not found", async () => {
      mockPrismaService.registration.findUnique.mockResolvedValueOnce(null);
      await expect(service.findParticipantDetail("t1", "r1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFound if registration belongs to another tenant", async () => {
      mockPrismaService.registration.findUnique.mockResolvedValueOnce({
        event: { tenantId: "t2" },
      });
      await expect(service.findParticipantDetail("t1", "r1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return participant detail and history", async () => {
      mockPrismaService.registration.findUnique.mockResolvedValueOnce({
        id: "r1",
        userId: "u1",
        event: { tenantId: "t1" },
      });
      mockPrismaService.registration.findMany.mockResolvedValueOnce([
        { id: "r2" },
      ]); // history

      const result = await service.findParticipantDetail("t1", "r1");
      expect(result.id).toBe("r1");
      expect(result.history.length).toBe(1);
    });
  });

  describe("deleteEvent", () => {
    it("should throw NotFound if event not found during delete", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce(null);
      await expect(service.deleteEvent("t1", "e1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw if trying to delete a PUBLISHED event", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce({
        id: "e1",
        status: "PUBLISHED",
      });
      await expect(service.deleteEvent("t1", "e1")).rejects.toThrow(
        "Apenas eventos em rascunho ou arquivados podem ser excluídos.",
      );
    });

    it("should delete successfully", async () => {
      mockPrismaService.event.findFirst.mockResolvedValueOnce({
        id: "e1",
        status: "DRAFT",
      });
      mockPrismaService.event.delete.mockResolvedValueOnce({ id: "e1" });
      await service.deleteEvent("t1", "e1");
      expect(mockPrismaService.event.delete).toHaveBeenCalled();
    });
  });
});
