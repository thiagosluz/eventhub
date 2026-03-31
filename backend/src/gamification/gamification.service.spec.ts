import { Test, TestingModule } from "@nestjs/testing";
import { GamificationService } from "./gamification.service";
import { PrismaService } from "../prisma/prisma.service";

describe("GamificationService", () => {
  let service: GamificationService;

  const mockTx = {
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
  };

  const mockPrismaService = {
    $transaction: jest.fn((cb) => cb(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateLevel", () => {
    it("should return level 1 for 0 or negative XP", () => {
      expect(service.calculateLevel(0)).toBe(1);
      expect(service.calculateLevel(-100)).toBe(1);
    });

    it("should calculate levels correctly based on formula", () => {
      // Formula: floor((XP / 500)^0.6) + 1
      expect(service.calculateLevel(500)).toBe(2); // (1^0.6) + 1 = 2
      expect(service.calculateLevel(1000)).toBe(2); // (2^0.6) + 1 = 1.51 + 1 = 2
      expect(service.calculateLevel(2500)).toBe(3); // (5^0.6) + 1 = 2.62 + 1 = 3
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
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { xp: 550, level: 2 },
      });
      expect(result.xpGained).toBe(100);
      expect(result.isLevelUp).toBe(true);
    });

    it("should return ALREADY_AWARDED if uniqueKey exists", async () => {
      mockTx.xpGainLog.findUnique.mockResolvedValue({ id: "log1" });

      const result = await service.awardXp(userId, amount, reason, "key1");

      expect(result.reason).toBe("ALREADY_AWARDED");
      expect(mockTx.user.update).not.toHaveBeenCalled();
    });

    it("should enforce daily XP limit", async () => {
      // Already gained 1450 today. Limit is 1500. Award 100 -> only 50 gained.
      mockTx.xpGainLog.aggregate.mockResolvedValue({ _sum: { amount: 1450 } });
      mockTx.user.findUnique.mockResolvedValue({ xp: 1450, level: 1 });

      const result = await service.awardXp(userId, 100, reason);

      expect(result.xpGained).toBe(50);
    });

    it("should return DAILY_LIMIT_REACHED if limit already hit", async () => {
      mockTx.xpGainLog.aggregate.mockResolvedValue({ _sum: { amount: 1500 } });

      const result = await service.awardXp(userId, 100, reason);

      expect(result.reason).toBe("DAILY_LIMIT_REACHED");
    });

    it("should return USER_NOT_FOUND if user does not exist", async () => {
      mockTx.xpGainLog.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
      mockTx.user.findUnique.mockResolvedValue(null);

      const result = await service.awardXp(userId, amount, reason);

      expect(result.reason).toBe("USER_NOT_FOUND");
    });

    it("should handle P2002 error (unique constraint) as ALREADY_AWARDED", async () => {
      mockPrismaService.$transaction.mockRejectedValue({ code: "P2002" });

      const result = await service.awardXp(userId, amount, reason);

      expect(result.reason).toBe("ALREADY_AWARDED");
    });

    it("should rethrow other errors", async () => {
      const error = new Error("DB_FAIL");
      mockPrismaService.$transaction.mockRejectedValue(error);

      await expect(service.awardXp(userId, amount, reason)).rejects.toThrow("DB_FAIL");
    });
  });
});
