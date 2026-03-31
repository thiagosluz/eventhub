import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { BadgesService } from "../badges/badges.service";
import { GamificationService } from "../gamification/gamification.service";
import { ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";

jest.mock("argon2");

describe("UsersService", () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    speaker: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    xpGainLog: {
      findFirst: jest.fn(),
    },
    eventMonitor: {
      findMany: jest.fn(),
    },
  };

  const mockMinioService = {
    uploadObject: jest.fn(),
  };

  const mockBadgesService = {
    checkAndAwardBadge: jest.fn(),
  };

  const mockGamificationService = {
    awardXp: jest.fn().mockResolvedValue({ xpGained: 100, isLevelUp: false }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MinioService, useValue: mockMinioService },
        { provide: BadgesService, useValue: mockBadgesService },
        { provide: GamificationService, useValue: mockGamificationService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findMe", () => {
    it("should return user info", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "u1",
        name: "User",
      });
      const result = await service.findMe("u1");
      expect(result.name).toBe("User");
    });

    it("should throw NotFoundException if user not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.findMe("u1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateProfile", () => {
    it("should throw ConflictException if email in use", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1" });
      mockPrismaService.user.findFirst.mockResolvedValue({ id: "u2" });
      await expect(
        service.updateProfile("u1", { email: "used@test.com" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should update profile and sync to speaker", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1" });
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue({
        id: "u1",
        name: "New Name",
      });
      mockPrismaService.speaker.findUnique.mockResolvedValue({ id: "s1" });

      const result = await service.updateProfile("u1", { name: "New Name" });

      expect(result.name).toBe("New Name");
      expect(mockPrismaService.speaker.update).toHaveBeenCalled();
      expect(mockBadgesService.checkAndAwardBadge).toHaveBeenCalledWith(
        "u1",
        null,
        "PROFILE_COMPLETED",
      );
    });

    it("should award XP if profile becomes complete and not previously awarded", async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1" });
        mockPrismaService.user.findFirst.mockResolvedValue(null);
        mockPrismaService.xpGainLog.findFirst.mockResolvedValue(null);
        mockPrismaService.user.update.mockResolvedValue({ 
            id: "u1", 
            name: "N", 
            email: "e@t.com", 
            bio: "B", 
            username: "u", 
            avatarUrl: "a", 
            interests: ["I"] 
        });
        
        const result = await service.updateProfile("u1", { name: "N" });
        expect(result.xpGained).toBe(100);
        expect(mockGamificationService.awardXp).toHaveBeenCalled();
    });
  });

  describe("updatePassword", () => {
    it("should update password if correct current password", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1", password: "hashed" });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue("new_hashed");

      await service.updatePassword("u1", { currentPassword: "old", newPassword: "new" });

      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it("should throw Unauthorized if password doesn't match", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1", password: "hashed" });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.updatePassword("u1", { currentPassword: "wrong", newPassword: "new" })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("uploadAvatar", () => {
    it("should upload avatar and sync to speaker", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1" });
      mockMinioService.uploadObject.mockResolvedValue("http://avatar.com");
      mockPrismaService.user.update.mockResolvedValue({ id: "u1", avatarUrl: "http://avatar.com" });
      mockPrismaService.speaker.findUnique.mockResolvedValue({ id: "s1" });

      const result = await service.uploadAvatar("u1", { buffer: Buffer.from(""), mimetype: "image/png" });
      expect(result.avatarUrl).toBe("http://avatar.com");
      expect(mockPrismaService.speaker.update).toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should list users for a tenant or with registrations in the tenant", async () => {
      mockPrismaService.user.findMany.mockResolvedValue([{ id: "u1" }]);
      const result = await service.findAll("t1");
      expect(result).toHaveLength(1);
    });
  });

  describe("findMyMonitoredEvents", () => {
    it("should list monitored events", async () => {
      mockPrismaService.eventMonitor.findMany.mockResolvedValue([{ event: { id: "e1" } }]);
      const result = await service.findMyMonitoredEvents("u1");
      expect(result).toHaveLength(1);
    });
  });

  describe("findByUsername", () => {
    it("should return public profile", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1", username: "test" });
      const result = await service.findByUsername("test");
      expect(result.username).toBe("test");
    });

    it("should throw NotFound if profile missing or private", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.findByUsername("test")).rejects.toThrow(NotFoundException);
    });
  });
});
