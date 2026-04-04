import { Test, TestingModule } from "@nestjs/testing";
import { StaffManagementService } from "./staff-management.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConflictException, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";

jest.mock("argon2");

describe("StaffManagementService", () => {
  let service: StaffManagementService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    eventMonitor: {
      upsert: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    registration: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffManagementService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StaffManagementService>(StaffManagementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createOrganizer", () => {
    const dto = {
      email: "org@test.com",
      name: "Org",
      temporaryPassword: "123",
    };

    it("should throw ConflictException if user already exists", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1" });
      await expect(service.createOrganizer("t1", dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should create organizer with hashed password", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue("hashed");
      mockPrismaService.user.create.mockResolvedValue({
        id: "ulet",
        role: "ORGANIZER",
      });

      const result = await service.createOrganizer("t1", dto);

      expect(argon2.hash).toHaveBeenCalledWith("123");
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "org@test.com",
          role: "ORGANIZER",
          password: "hashed",
          mustChangePassword: true,
        }),
        select: expect.any(Object),
      });
      expect(result.role).toBe("ORGANIZER");
    });
  });

  describe("listOrganizers", () => {
    it("should return organizers for tenant", async () => {
      mockPrismaService.user.findMany.mockResolvedValue([{ id: "u1" }]);
      const result = await service.listOrganizers("t1");
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "t1", role: "ORGANIZER" },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("assignMonitor", () => {
    it("should throw NotFound if event not found", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.assignMonitor("e1", "u1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFound if user not found", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "e1" });
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.assignMonitor("e1", "u1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should upsert event monitor", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "e1" });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1" });
      mockPrismaService.eventMonitor.upsert.mockResolvedValue({ id: "m1" });

      const result = await service.assignMonitor("e1", "u1");
      expect(mockPrismaService.eventMonitor.upsert).toHaveBeenCalledWith({
        where: { eventId_userId: { eventId: "e1", userId: "u1" } },
        create: { eventId: "e1", userId: "u1" },
        update: {},
      });
      expect(result.id).toBe("m1");
    });
  });

  describe("removeMonitor", () => {
    it("should delete event monitor", async () => {
      mockPrismaService.eventMonitor.delete.mockResolvedValue({});
      await service.removeMonitor("e1", "u1");
      expect(mockPrismaService.eventMonitor.delete).toHaveBeenCalledWith({
        where: { eventId_userId: { eventId: "e1", userId: "u1" } },
      });
    });
  });

  describe("listMonitors", () => {
    it("should list monitors with user info", async () => {
      mockPrismaService.eventMonitor.findMany.mockResolvedValue([]);
      await service.listMonitors("e1");
      expect(mockPrismaService.eventMonitor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: "e1" },
          include: { user: expect.any(Object) },
        }),
      );
    });
  });

  describe("listEventParticipants", () => {
    it("should list registrations with user info", async () => {
      mockPrismaService.registration.findMany.mockResolvedValue([]);
      await service.listEventParticipants("e1");
      expect(mockPrismaService.registration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: "e1" },
          include: { user: expect.any(Object) },
        }),
      );
    });
  });
});
