import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { BadgesService } from "./../src/badges/badges.service";
import { MailService } from "./../src/mail/mail.service";
import { GamificationService } from "./../src/gamification/gamification.service";

describe("Checkin (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    ticket: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    activity: {
      findUnique: jest.fn(),
    },
    activityEnrollment: {
      findFirst: jest.fn(),
    },
    attendance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    event: {
      findFirst: jest.fn(),
    },
    raffleHistory: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: "org_1",
        role: "ORGANIZER",
        tenantId: "tenant_1",
      }),
    },
    eventMonitor: {
      findUnique: jest.fn(),
    },
    xpGainLog: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockBadgesService = {
    checkAndAwardBadge: jest.fn(),
  };

  const mockMailService = {
    enqueue: jest.fn(),
  };

  const mockGamificationService = {
    awardXp: jest.fn().mockResolvedValue({ xpGained: 100, isLevelUp: false }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(BadgesService)
      .useValue(mockBadgesService)
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .overrideProvider(GamificationService)
      .useValue(mockGamificationService)
      .compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("GET /tickets/:id/qrcode", () => {
    it("should return 200 and PNG for owner", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        email: "user@test.com",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.ticket.findFirst.mockResolvedValue({
        id: "t1",
        qrCodeToken: "token",
        registration: { userId: "user_1" },
      });

      return request(app.getHttpServer())
        .get("/tickets/t1/qrcode")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .expect("Content-Type", /image\/png/);
    });
  });

  describe("Check-in Flow", () => {
    it("POST /checkin - should perform check-in successfully", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.ticket.findUnique.mockResolvedValue({
        id: "t1",
        eventId: "e1",
        registrationId: "r1",
        attendances: [],
        event: { tenantId: "tenant_1" },
      });
      mockPrismaService.attendance.findFirst.mockResolvedValue(null);
      mockPrismaService.attendance.create.mockResolvedValue({
        id: "att1",
        ticket: {
          registration: {
            user: { id: "u1", name: "User", email: "user@example.com" },
            event: { id: "e1", name: "Event" },
          },
        },
      });

      return request(app.getHttpServer())
        .post("/checkin")
        .set("Authorization", `Bearer ${token}`)
        .send({ qrCodeToken: "valid_token" })
        .expect(201);
    });

    it("DELETE /checkin/:id - should undo a check-in (Organizer)", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.attendance.findUnique.mockResolvedValue({
        id: "att1",
        ticket: { eventId: "e1", event: { tenantId: "tenant_1" } },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "org_1",
        role: "ORGANIZER",
        tenantId: "tenant_1",
      });
      mockPrismaService.attendance.delete.mockResolvedValue({ id: "att1" });

      return request(app.getHttpServer())
        .delete("/checkin/att1")
        .set("Authorization", `Bearer ${token}`)
        .expect(204);
    });

    it("DELETE /checkin/:id - should undo a check-in (Monitor)", async () => {
      const token = await jwtService.signAsync({
        sub: "monitor_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.attendance.findUnique.mockResolvedValue({
        id: "att1",
        ticket: { eventId: "e1", event: { tenantId: "tenant_1" } },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "monitor_1",
        role: "PARTICIPANT",
        tenantId: "tenant_1",
      });
      mockPrismaService.eventMonitor.findUnique.mockResolvedValue({ id: "m1" });
      mockPrismaService.attendance.delete.mockResolvedValue({ id: "att1" });

      return request(app.getHttpServer())
        .delete("/checkin/att1")
        .set("Authorization", `Bearer ${token}`)
        .expect(204);
    });

    it("DELETE /checkin/:id - should return 403 for unauthorized participant", async () => {
      const token = await jwtService.signAsync({
        sub: "user_2",
        role: "PARTICIPANT",
      });

      mockPrismaService.attendance.findUnique.mockResolvedValue({
        id: "att1",
        ticket: { eventId: "e1", event: { tenantId: "tenant_1" } },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user_2",
        role: "PARTICIPANT",
        tenantId: "tenant_1",
      });
      mockPrismaService.eventMonitor.findUnique.mockResolvedValue(null);

      return request(app.getHttpServer())
        .delete("/checkin/att1")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });

  describe("Raffles", () => {
    it("POST /raffles - should draw a raffle winner", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.attendance.findMany.mockResolvedValue([
        {
          ticket: {
            registration: {
              id: "reg1",
              user: { name: "Winner", role: "PARTICIPANT" },
            },
          },
        },
      ]);
      mockPrismaService.raffleHistory.create.mockResolvedValue({ id: "h1" });

      return request(app.getHttpServer())
        .post("/raffles")
        .set("Authorization", `Bearer ${token}`)
        .send({ eventId: "e1", count: 1 })
        .expect(201);
    });

    it("GET /raffles/latest/:eventId - should get latest raffle", async () => {
      const token = await jwtService.signAsync({
        sub: "u1",
        tenantId: "t1",
        role: "ORGANIZER",
      });
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.raffleHistory.findMany.mockResolvedValue([
        { id: "h1", registration: { user: { name: "W" } }, activity: null },
      ]);

      return request(app.getHttpServer())
        .get("/raffles/latest/e1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("POST /raffles/history/:id/hide - should toggle raffle visibility", async () => {
      const token = await jwtService.signAsync({
        sub: "u1",
        tenantId: "t1",
        role: "ORGANIZER",
      });
      mockPrismaService.raffleHistory.findUnique.mockResolvedValue({
        id: "h1",
        event: { tenantId: "t1" },
      });

      return request(app.getHttpServer())
        .post("/raffles/history/h1/hide")
        .set("Authorization", `Bearer ${token}`)
        .send({ hide: true })
        .expect(201);
    });

    it("POST /raffles/history/:id/receive - should mark prize as received", async () => {
      const token = await jwtService.signAsync({
        sub: "u1",
        tenantId: "t1",
        role: "ORGANIZER",
      });

      mockPrismaService.raffleHistory.findUnique.mockResolvedValue({
        id: "h1",
        eventId: "e1",
        registration: { userId: "u1" },
        event: { tenantId: "t1" },
      });
      mockPrismaService.raffleHistory.update.mockResolvedValue({
        id: "h1",
        hasReceived: true,
      });

      return request(app.getHttpServer())
        .post("/raffles/history/h1/receive")
        .set("Authorization", `Bearer ${token}`)
        .send({ received: true })
        .expect(201);
    });

    it("DELETE /raffles/history/:id - should delete raffle history", async () => {
      const token = await jwtService.signAsync({
        sub: "u1",
        tenantId: "t1",
        role: "ORGANIZER",
      });
      mockPrismaService.raffleHistory.findUnique.mockResolvedValue({
        id: "h1",
        event: { tenantId: "t1" },
      });
      mockPrismaService.raffleHistory.delete.mockResolvedValue({ id: "h1" });

      return request(app.getHttpServer())
        .delete("/raffles/history/h1")
        .set("Authorization", `Bearer ${token}`)
        .expect(204);
    });
  });
});
