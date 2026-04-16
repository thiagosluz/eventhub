import { Test, TestingModule } from "@nestjs/testing";
import { GamificationService } from "./gamification.service";
import { PrismaService } from "../prisma/prisma.service";

describe("GamificationService", () => {
  let service: GamificationService;
  let mockTx: any;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockTx = {
      $executeRawUnsafe: jest.fn(),
      xpGainLog: {
        findUnique: jest.fn(),
        aggregate: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      gamificationAlert: {
        create: jest.fn(),
      },
    };

    mockPrismaService = {
      $transaction: jest.fn((cb) => cb(mockTx)),
      xpGainLog: { aggregate: jest.fn(), groupBy: jest.fn() },
      userBadge: { count: jest.fn() },
      gamificationAlert: {
        count: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      registration: { count: jest.fn() },
      user: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  describe("calculateLevel", () => {
    it("should return level 1 for 0 or negative XP", () => {
      expect(service.calculateLevel(0)).toBe(1);
      expect(service.calculateLevel(-100)).toBe(1);
    });

    it("should calculate levels correctly based on formula", () => {
      expect(service.calculateLevel(500)).toBe(2);
      expect(service.calculateLevel(1000)).toBe(2);
      expect(service.calculateLevel(2500)).toBe(3);
    });
  });

  describe("awardXp", () => {
    const userId = "u1";
    const amount = 100;
    const reason = "TEST";

    it("should award XP and potentially level up", async () => {
      mockTx.xpGainLog.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      mockTx.user.findUnique.mockResolvedValue({ xp: 450, level: 1 });
      mockTx.user.update.mockResolvedValue({});
      mockTx.xpGainLog.create.mockResolvedValue({});

      const result = await service.awardXp(userId, amount, reason);

      expect(mockTx.$executeRawUnsafe).toHaveBeenCalled();
      expect(mockTx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { xp: 550, level: 2 },
        }),
      );
      expect(result.xpGained).toBe(100);
      expect(result.isLevelUp).toBe(true);
    });

    it("should return USER_NOT_FOUND if user does not exist", async () => {
      mockTx.xpGainLog.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      mockTx.user.findUnique.mockResolvedValue(null);
      const result = await service.awardXp(userId, amount, reason);
      expect(result.reason).toBe("USER_NOT_FOUND");
    });

    it("should return DAILY_LIMIT_REACHED if limit already hit", async () => {
      mockTx.xpGainLog.aggregate.mockResolvedValue({ _sum: { amount: 1500 } });
      const result = await service.awardXp(userId, 100, reason);
      expect(result.reason).toBe("DAILY_LIMIT_REACHED");
    });

    it("should handle P2002 error as ALREADY_AWARDED", async () => {
      mockPrismaService.$transaction.mockRejectedValue({ code: "P2002" });
      const result = await service.awardXp(userId, amount, reason);
      expect(result.reason).toBe("ALREADY_AWARDED");
    });

    it("should create a spike alert if user gains 1000+ XP in 5 minutes", async () => {
      mockTx.xpGainLog.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 0 } }) // Daily check
        .mockResolvedValueOnce({ _sum: { amount: 1200 } }); // Spike check

      mockTx.user.findUnique.mockResolvedValue({ xp: 0, level: 1 });
      mockTx.user.update.mockResolvedValue({});
      mockTx.xpGainLog.create.mockResolvedValue({});
      mockTx.gamificationAlert.create.mockResolvedValue({});

      await service.awardXp(userId, 500, reason, undefined, "event-1");

      expect(mockTx.gamificationAlert.create).toHaveBeenCalled();
    });
  });

  describe("getters and resolvers", () => {
    it("should get event stats", async () => {
      mockPrismaService.xpGainLog.aggregate.mockResolvedValue({
        _sum: { amount: 5000 },
      });
      mockPrismaService.userBadge.count.mockResolvedValue(10);
      mockPrismaService.gamificationAlert.count.mockResolvedValue(2);
      mockPrismaService.registration.count.mockResolvedValue(50);

      const stats = await service.getEventStats("event-1");
      expect(stats.totalXpDistributed).toBe(5000);
      expect(stats.totalBadgesAwarded).toBe(10);
    });

    it("should get event ranking", async () => {
      mockPrismaService.xpGainLog.groupBy.mockResolvedValue([
        { userId: "u1", _sum: { amount: 1000 } },
      ]);
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: "u1", name: "User 1", level: 5 },
      ]);

      const ranking = await service.getEventRanking("event-1");
      expect(ranking[0].userName).toBe("User 1");
    });

    it("should resolve an alert", async () => {
      mockPrismaService.gamificationAlert.update.mockResolvedValue({
        id: "a1",
        resolved: true,
      });
      const result = await service.resolveAlert("a1");
      expect(result.resolved).toBe(true);
    });
  });
});
