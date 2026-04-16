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

  it("should create event", async () => {
    mockPrismaService.event.findFirst.mockResolvedValue(null);
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
