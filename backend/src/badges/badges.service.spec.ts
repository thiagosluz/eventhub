import { Test, TestingModule } from "@nestjs/testing";
import { BadgesService } from "./badges.service";
import { PrismaService } from "../prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";

describe("BadgesService", () => {
  let service: BadgesService;

  const mockPrismaService = {
    badge: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    badgeClaimCode: {
      createMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    userBadge: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn().mockResolvedValue({ userId: "u1", badgeId: "b1" }),
    },
    user: {
      findUnique: jest.fn(),
    },
    registration: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    attendance: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    ticket: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BadgesService>(BadgesService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createBadge", () => {
    it("should create a badge and generate codes if UNIQUE_CODES is set", async () => {
      const dto = {
        name: "Early Bird",
        manualDeliveryMode: "UNIQUE_CODES",
        codesCount: 5,
      };
      mockPrismaService.badge.create.mockResolvedValue({ id: "b1" });

      await service.createBadge("t1", "e1", dto);

      expect(mockPrismaService.badge.create).toHaveBeenCalled();
      expect(mockPrismaService.badgeClaimCode.createMany).toHaveBeenCalled();
      const codes =
        mockPrismaService.badgeClaimCode.createMany.mock.calls[0][0].data;
      expect(codes).toHaveLength(5);
    });
  });

  describe("checkAndAwardBadge", () => {
    describe("PROFILE_COMPLETED", () => {
      it("should award badge if profile is complete (bio + avatar)", async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({
          id: "u1",
          tenantId: "t1",
          bio: "This is a long enough bio for the badge requirement of 50 characters.",
          avatarUrl: "http://avatar.com",
        });
        mockPrismaService.badge.findMany.mockResolvedValue([
          { id: "b1", tenantId: "t1", triggerRule: "PROFILE_COMPLETED" },
        ]);
        mockPrismaService.userBadge.findUnique.mockResolvedValue(null);

        const result = await service.checkAndAwardBadge(
          "u1",
          "e1",
          "PROFILE_COMPLETED",
        );

        expect(result).toHaveLength(1);
        expect(mockPrismaService.userBadge.create).toHaveBeenCalled();
      });

      it("should NOT award badge if bio is too short", async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({
          id: "u1",
          tenantId: "t1",
          bio: "Short bio",
          avatarUrl: "http://avatar.com",
        });
        mockPrismaService.badge.findMany.mockResolvedValue([
          { id: "b1", triggerRule: "PROFILE_COMPLETED" },
        ]);

        const result = await service.checkAndAwardBadge(
          "u1",
          "e1",
          "PROFILE_COMPLETED",
        );
        expect(result).toHaveLength(0);
      });
    });

    describe("EARLY_BIRD", () => {
      it("should award badge if user is within top N registrations", async () => {
        const userReg = { id: "r1", createdAt: new Date() };
        mockPrismaService.badge.findMany.mockResolvedValue([
          { id: "b1", triggerRule: "EARLY_BIRD", minRequirement: 10 },
        ]);
        mockPrismaService.registration.findFirst.mockResolvedValue(userReg);
        mockPrismaService.registration.count.mockResolvedValue(5); // User is 6th
        mockPrismaService.userBadge.findUnique.mockResolvedValue(null);

        const result = await service.checkAndAwardBadge(
          "u1",
          "e1",
          "EARLY_BIRD",
        );
        expect(result).toHaveLength(1);
      });
    });

    describe("CHECKIN_STREAK", () => {
      it("should award badge if checkin count meets requirement", async () => {
        mockPrismaService.badge.findMany.mockResolvedValue([
          { id: "b1", triggerRule: "CHECKIN_STREAK", minRequirement: 3 },
        ]);
        mockPrismaService.attendance.count.mockResolvedValue(3);
        mockPrismaService.userBadge.findUnique.mockResolvedValue(null);

        const result = await service.checkAndAwardBadge("u1", "e1", "CHECKIN_STREAK");
        expect(result).toHaveLength(1);
      });
    });

    describe("ACTIVITY_HOURS", () => {
      it("should award badge if total hours meet requirement", async () => {
        const start = new Date();
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours
        mockPrismaService.badge.findMany.mockResolvedValue([
          { id: "b1", triggerRule: "ACTIVITY_HOURS", minRequirement: 1, tenantId: "t1" },
        ]);
        mockPrismaService.attendance.findMany.mockResolvedValue([
          { activity: { startAt: start, endAt: end } },
        ]);
        mockPrismaService.userBadge.findUnique.mockResolvedValue(null);

        const result = await service.checkAndAwardBadge("u1", "e1", "ACTIVITY_HOURS");
        expect(result).toHaveLength(1);
      });
    });

    describe("EVENT_COUNT", () => {
      it("should award badge if event count meets requirement", async () => {
        mockPrismaService.badge.findMany.mockResolvedValue([
          { id: "b1", triggerRule: "EVENT_COUNT", minRequirement: 2, tenantId: "t1" },
        ]);
        mockPrismaService.registration.count.mockResolvedValue(2);
        mockPrismaService.userBadge.findUnique.mockResolvedValue(null);

        const result = await service.checkAndAwardBadge("u1", "e1", "EVENT_COUNT");
        expect(result).toHaveLength(1);
      });
    });
  });

  describe("claimBadge errors", () => {
    it("should throw if already earned (Global Code)", async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({
        id: "b1",
        triggerRule: "MANUAL",
        manualDeliveryMode: "GLOBAL_CODE",
        claimCode: "C",
      });
      mockPrismaService.userBadge.findUnique.mockResolvedValue({ id: "ub1" });
      await expect(service.claimBadge("u1", "b1", "C")).rejects.toThrow(BadRequestException);
    });

    it("should throw if unique code already used", async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({
        id: "b1",
        triggerRule: "MANUAL",
        manualDeliveryMode: "UNIQUE_CODES",
      });
      mockPrismaService.badgeClaimCode.findFirst.mockResolvedValue({ id: "c1", isUsed: true });
      await expect(service.claimBadge("u1", "b1", "UNIQ")).rejects.toThrow("Este código já foi utilizado");
    });
  });

  describe("CRUD with permission", () => {
    it("should update badge if owner", async () => {
      mockPrismaService.badge.findFirst.mockResolvedValue({ id: "b1" });
      mockPrismaService.badge.update.mockResolvedValue({ id: "b1" });
      await service.updateBadge("t1", "b1", { name: "Upd" });
      expect(mockPrismaService.badge.update).toHaveBeenCalled();
    });

    it("should delete badge if owner", async () => {
      mockPrismaService.badge.findFirst.mockResolvedValue({ id: "b1" });
      await service.deleteBadge("t1", "b1");
      expect(mockPrismaService.badge.delete).toHaveBeenCalled();
    });
  });

  describe("Retrieval", () => {
    it("should return my badges", async () => {
      mockPrismaService.userBadge.findMany.mockResolvedValue([{ id: "ub1" }]);
      const result = await service.getMyBadges("u1");
      expect(result).toHaveLength(1);
    });

    it("should return available badges with earned status", async () => {
      mockPrismaService.registration.findMany.mockResolvedValue([{ eventId: "e1" }]);
      mockPrismaService.badge.findMany.mockResolvedValue([{ id: "b1", event: { name: "E" } }]);
      mockPrismaService.userBadge.findMany.mockResolvedValue([{ badgeId: "b1" }]);

      const result = await service.getAvailableBadges("u1");
      expect(result[0].isEarned).toBe(true);
    });
  });

  it("should award EVENT_COUNT badge", async () => {
    mockPrismaService.badge.findMany.mockResolvedValue([{ id: "b1", triggerRule: "EVENT_COUNT", minRequirement: 1, tenantId: "t1" }]);
    mockPrismaService.registration.count.mockResolvedValue(1);
    mockPrismaService.userBadge.findUnique.mockResolvedValue(null);
    await service.checkAndAwardBadge("u1", "e1", "EVENT_COUNT");
    expect(mockPrismaService.userBadge.create).toHaveBeenCalled();
  });

  it("should skip if EVENT_COUNT threshold not met", async () => {
    mockPrismaService.badge.findMany.mockResolvedValue([{ id: "b1", triggerRule: "EVENT_COUNT", minRequirement: 5, tenantId: "t1" }]);
    mockPrismaService.registration.count.mockResolvedValue(3);
    await service.checkAndAwardBadge("u1", "e1", "EVENT_COUNT");
    expect(mockPrismaService.userBadge.create).not.toHaveBeenCalled();
  });

  it("should skip if EARLY_BIRD position too high", async () => {
    mockPrismaService.badge.findMany.mockResolvedValue([{ id: "b1", triggerRule: "EARLY_BIRD", minRequirement: 10 }]);
    mockPrismaService.registration.findFirst.mockResolvedValue({ id: "r1", createdAt: new Date() });
    mockPrismaService.registration.count.mockResolvedValue(15);
    await service.checkAndAwardBadge("u1", "e1", "EARLY_BIRD");
    expect(mockPrismaService.userBadge.create).not.toHaveBeenCalled();
  });

  it("should skip if PROFILE_COMPLETED criteria not met", async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1", tenantId: "t1", bio: "short", avatarUrl: null });
    mockPrismaService.badge.findMany.mockResolvedValue([{ id: "b1", triggerRule: "PROFILE_COMPLETED", tenantId: "t1" }]);
    await service.checkAndAwardBadge("u1", "e1", "PROFILE_COMPLETED");
    expect(mockPrismaService.userBadge.create).not.toHaveBeenCalled();
  });

  describe("awardBadgeByScan - errors", () => {
    it("should throw if badge belongs to other tenant", async () => {
      mockPrismaService.badge.findFirst.mockResolvedValue(null);
      await expect(service.awardBadgeByScan("t1", "b1", "TKN")).rejects.toThrow("Badge not found");
    });

    it("should throw if ticket invalid", async () => {
      mockPrismaService.badge.findFirst.mockResolvedValue({ id: "b1" });
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);
      await expect(service.awardBadgeByScan("t1", "b1", "INVALID")).rejects.toThrow("Ingresso inválido");
    });

    it("should return existing if badge already awarded", async () => {
      mockPrismaService.badge.findFirst.mockResolvedValue({ id: "b1" });
      mockPrismaService.ticket.findFirst.mockResolvedValue({ registration: { userId: "u1" }, eventId: "e1" });
      mockPrismaService.userBadge.findUnique.mockResolvedValue({ id: "ub1" });
      const result = await service.awardBadgeByScan("t1", "b1", "TKN");
      expect(result.id).toBe("ub1");
    });
  });

  describe("claimBadge - scan and codes", () => {
    it("should throw if scanner required but code provided", async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({
        id: "b1",
        triggerRule: "MANUAL",
        manualDeliveryMode: "SCAN",
      });
      await expect(service.claimBadge("u1", "b1", "CODE")).rejects.toThrow("Esta conquista requer escaneamento");
    });

    it("should award by scan if badge and ticket valid", async () => {
      mockPrismaService.badge.findFirst.mockResolvedValue({ id: "b1", eventId: "e1" });
      mockPrismaService.ticket.findFirst.mockResolvedValue({ registration: { userId: "u2" }, eventId: "e1" });
      mockPrismaService.userBadge.findUnique.mockResolvedValue(null);

      await service.awardBadgeByScan("t1", "b1", "TKN");
      expect(mockPrismaService.userBadge.create).toHaveBeenCalled();
    });
  });

  describe("Admin and Listing", () => {
    it("should list badges by event", async () => {
      await service.getBadgesByEvent("t1", "e1");
      expect(mockPrismaService.badge.findMany).toHaveBeenCalledWith({
        where: { tenantId: "t1", eventId: "e1" },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return badge claim codes", async () => {
      mockPrismaService.badge.findFirst.mockResolvedValue({ id: "b1" });
      mockPrismaService.badgeClaimCode.findMany.mockResolvedValue([{ id: "code1" }]);
      const result = await service.getBadgeClaimCodes("t1", "b1");
      expect(result).toHaveLength(1);
    });
  });

  describe("claimBadge - error paths", () => {
    it("should throw if trigger rule is not MANUAL", async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({ triggerRule: "AUTO" });
      await expect(service.claimBadge("u1", "b1", "CODE")).rejects.toThrow(
        "Esta conquista não pode ser resgatada manualmente",
      );
    });

    it("should throw if global code matches but is invalid", async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({
        id: "b1",
        triggerRule: "MANUAL",
        manualDeliveryMode: "GLOBAL_CODE",
        claimCode: "VALID",
      });
      await expect(service.claimBadge("u1", "b1", "WRONG")).rejects.toThrow(
        "Código de resgate inválido",
      );
    });

    it("should claim unique code and mark as used", async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({ id: "b1", triggerRule: "MANUAL", manualDeliveryMode: "UNIQUE_CODES", eventId: "e1" });
      mockPrismaService.badgeClaimCode.findFirst.mockResolvedValue({ id: "c1", isUsed: false });
      mockPrismaService.userBadge.findUnique.mockResolvedValue(null);
      await service.claimBadge("u1", "b1", "UCODE");
      expect(mockPrismaService.badgeClaimCode.update).toHaveBeenCalled();
      expect(mockPrismaService.userBadge.create).toHaveBeenCalled();
    });

    it("should return existing badge if already earned (unique code)", async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue({ id: "b1", triggerRule: "MANUAL", manualDeliveryMode: "UNIQUE_CODES", eventId: "e1" });
      mockPrismaService.badgeClaimCode.findFirst.mockResolvedValue({ id: "c1", isUsed: false });
      mockPrismaService.userBadge.findUnique.mockResolvedValue({ id: "ub1" });
      const result = await service.claimBadge("u1", "b1", "UCODE");
      expect(result.id).toBe("ub1");
    });
  });
});
