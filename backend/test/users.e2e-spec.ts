import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ActivitiesProcessor } from "./../src/activities/activities.processor";
import { AssignReviewsProcessor } from "./../src/submissions/submissions.processor";
import { MailProcessor } from "./../src/mail/mail.processor";
import { getQueueToken } from "@nestjs/bullmq";
import { MinioService } from "./../src/storage/minio.service";
import { BadgesService } from "./../src/badges/badges.service";
import { GamificationService } from "./../src/gamification/gamification.service";
import * as argon2 from "argon2";

describe("Users (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

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
    badge: {
      findMany: jest.fn(),
    },
    userBadge: {
      findUnique: jest.fn(),
    },
    eventMonitor: {
      findMany: jest.fn(),
    },
    xpGainLog: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockMinioService = {
    uploadObject: jest.fn().mockResolvedValue("http://minio/avatar"),
  };

  const mockBadgesService = {
    checkAndAwardBadge: jest.fn().mockResolvedValue(undefined),
  };

  const mockQueue = { add: jest.fn() };

  const mockGamificationService = {
    awardXp: jest.fn().mockResolvedValue({ xpGained: 100, isLevelUp: false }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(MinioService)
      .useValue(mockMinioService)
      .overrideProvider(BadgesService)
      .useValue(mockBadgesService)
      .overrideProvider(getQueueToken("activities"))
      .useValue(mockQueue)
      .overrideProvider(getQueueToken("assign-reviews"))
      .useValue(mockQueue)
      .overrideProvider(getQueueToken("emails"))
      .useValue(mockQueue)
      .overrideProvider(ActivitiesProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(AssignReviewsProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(MailProcessor)
      .useValue({ process: jest.fn() })
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

  describe("GET /users/me", () => {
    it("should return current user profile", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        email: "user@test.com",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user_1",
        email: "user@test.com",
        name: "Test User",
      });

      return request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .then((response) => {
          expect(response.body.email).toBe("user@test.com");
        });
    });

    it("should return monitored events", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        email: "user@test.com",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.eventMonitor.findMany.mockResolvedValue([
        { eventId: "evt_1", userId: "user_1", event: { name: "Test Event" } },
      ]);

      return request(app.getHttpServer())
        .get("/users/me/monitored-events")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveLength(1);
          expect(response.body[0].eventId).toBe("evt_1");
        });
    });
  });

  describe("PATCH /users/me", () => {
    it("should update profile", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        email: "user@test.com",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue({
        id: "user_1",
        name: "New Name",
      });
      mockPrismaService.speaker.findUnique.mockResolvedValue(null);
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Name" })
        .expect(200);
    });
  });

  describe("GET /users (Organizer only)", () => {
    it("should list users for organizer", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.user.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("should block participants", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      return request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });
  describe("Password & Avatar", () => {
    it("should update password", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      const currentPasswordHash = await argon2.hash("old");
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user_1",
        password: currentPasswordHash,
      });
      mockPrismaService.user.update.mockResolvedValue({ id: "user_1" });

      return request(app.getHttpServer())
        .patch("/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "old", newPassword: "new" })
        .expect(200);
    });

    it("should upload avatar", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.user.update.mockResolvedValue({
        id: "user_1",
        avatarUrl: "http://minio/avatar",
      });

      return request(app.getHttpServer())
        .post("/users/me/avatar")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("image content"), "avatar.png")
        .expect(201);
    });
  });
});
