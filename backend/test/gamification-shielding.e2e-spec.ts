import * as dotenv from "dotenv";
dotenv.config();
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://eventhub:eventhub@localhost:5432/eventhub";

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { GamificationService } from "../src/gamification/gamification.service";
import { randomUUID } from "crypto";

describe("Gamification Shielding (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let gamificationService: GamificationService;
  let testUser: any;

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      prisma = app.get<PrismaService>(PrismaService);
      gamificationService = app.get<GamificationService>(GamificationService);
    } catch (err) {
      console.error("FAILED TO INITIALIZE TEST APP", err);
      throw err;
    }

    // Create a clean test tenant and user
    const tenant = await prisma.tenant.create({
      data: {
        name: `Stress Test Org ${randomUUID()}`,
        slug: `stress-test-${randomUUID()}`,
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: `stress-test-${randomUUID()}@example.com`,
        password: "hashed_password",
        name: "Stress Tester",
        role: "PARTICIPANT",
        tenantId: tenant.id,
      },
    });
  });

  afterAll(async () => {
    if (testUser) {
      // Cleanup logs, user and tenant
      await prisma.xpGainLog.deleteMany({ where: { userId: testUser.id } });
      const userId = testUser.id;
      const tenantId = testUser.tenantId;
      await prisma.user.delete({ where: { id: userId } });
      await prisma.tenant.delete({ where: { id: tenantId } });
    }
    await app.close();
  });

  describe("Race Condition Shielding (UniqueKey)", () => {
    it("should award XP only once when 50 simultaneous requests hit the same uniqueKey", async () => {
      const uniqueKey = `STRESS_TEST_${randomUUID()}`;
      const amount = 100;
      const concurrentRequests = 50;

      // Execute 50 parallel requests
      const results = await Promise.all(
        Array(concurrentRequests)
          .fill(null)
          .map(() =>
            gamificationService.awardXp(
              testUser.id,
              amount,
              "STRESS_TEST",
              uniqueKey,
            ),
          ),
      );

      // Verify results
      const successes = results.filter((r) => r.xpGained > 0);
      const alreadyAwarded = results.filter(
        (r) => r.reason === "ALREADY_AWARDED",
      );

      expect(successes.length).toBe(1);
      expect(alreadyAwarded.length).toBe(concurrentRequests - 1);

      // Verify DB state
      const dbLogs = await prisma.xpGainLog.findMany({
        where: { userId: testUser.id, uniqueKey },
      });
      expect(dbLogs.length).toBe(1);

      const dbUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { xp: true },
      });
      expect(dbUser?.xp).toBe(amount);
    });
  });

  describe("Daily Limit Shielding (Atomic Transactions)", () => {
    it("should respect the daily limit of 1500 XP even under load", async () => {
      // Reset user XP for this test
      await prisma.user.update({
        where: { id: testUser.id },
        data: { xp: 0, level: 1 },
      });
      await prisma.xpGainLog.deleteMany({ where: { userId: testUser.id } });

      const amountPerRequest = 200;
      const requests = 10; // 10 * 200 = 2000 total (> 1500 limit)

      // Execute parallel requests with different uniqueKeys to bypass unique check but hit daily limit
      const results = await Promise.all(
        Array(requests)
          .fill(null)
          .map((_, i) =>
            gamificationService.awardXp(
              testUser.id,
              amountPerRequest,
              "DAILY_LIMIT_TEST",
              `LIMIT_TEST_${i}_${randomUUID()}`,
            ),
          ),
      );

      // Total XP awarded should be exactly 1500
      const totalAwarded = results.reduce((sum, r) => sum + r.xpGained, 0);
      expect(totalAwarded).toBe(1500);

      // Verify DB state
      const dbUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { xp: true },
      });
      expect(dbUser?.xp).toBe(1500);

      // The last request should have partially awarded only what's left
      const cappedResults = results.filter(
        (r) =>
          r.reason === "DAILY_LIMIT_REACHED" || r.xpGained < amountPerRequest,
      );
      expect(cappedResults.length).toBeGreaterThan(0);
    });
  });
});
