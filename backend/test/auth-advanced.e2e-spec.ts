import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { MailService } from "../src/mail/mail.service";
import { JwtService } from "@nestjs/jwt";
import { ActivitiesProcessor } from "./../src/activities/activities.processor";
import { AssignReviewsProcessor } from "./../src/submissions/submissions.processor";
import { MailProcessor } from "./../src/mail/mail.processor";
import { KanbanAlertsProcessor } from "./../src/kanban/kanban.processor";
import { getQueueToken } from "@nestjs/bullmq";

describe("Auth Advanced (e2e)", () => {
  let app: INestApplication;

  // In-memory refresh token store to emulate the database across register/refresh/logout calls.
  type RefreshTokenRow = {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    user?: Record<string, unknown>;
  };
  let refreshTokens: RefreshTokenRow[] = [];
  let userForRefresh: Record<string, unknown> | null = null;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    tenant: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    speaker: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "log_1" }),
    },
    refreshToken: {
      create: jest.fn(
        ({ data }: { data: Omit<RefreshTokenRow, "id" | "revokedAt"> }) => {
          const row: RefreshTokenRow = {
            id: `rt_${refreshTokens.length + 1}`,
            revokedAt: null,
            ...data,
          };
          refreshTokens.push(row);
          return Promise.resolve(row);
        },
      ),
      findUnique: jest.fn(({ where }: { where: { tokenHash: string } }) => {
        const row = refreshTokens.find((t) => t.tokenHash === where.tokenHash);
        if (!row) return Promise.resolve(null);
        return Promise.resolve({ ...row, user: userForRefresh });
      }),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<RefreshTokenRow>;
        }) => {
          const row = refreshTokens.find((t) => t.id === where.id);
          if (row) Object.assign(row, data);
          return Promise.resolve(row ?? null);
        },
      ),
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: Partial<RefreshTokenRow>;
          data: Partial<RefreshTokenRow>;
        }) => {
          let count = 0;
          for (const row of refreshTokens) {
            const match =
              (!where.userId || row.userId === where.userId) &&
              (!where.tokenHash || row.tokenHash === where.tokenHash) &&
              (where.revokedAt === undefined ||
                row.revokedAt === where.revokedAt);
            if (match) {
              Object.assign(row, data);
              count++;
            }
          }
          return Promise.resolve({ count });
        },
      ),
    },
  };
  const mockQueue = { add: jest.fn() };

  const mockMailService = {
    enqueue: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(getQueueToken("activities"))
      .useValue(mockQueue)
      .overrideProvider(getQueueToken("assign-reviews"))
      .useValue(mockQueue)
      .overrideProvider(getQueueToken("emails"))
      .useValue(mockQueue)
      .overrideProvider(getQueueToken("kanban-alerts"))
      .useValue(mockQueue)
      .overrideProvider(ActivitiesProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(AssignReviewsProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(MailProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(KanbanAlertsProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    refreshTokens = [];
    userForRefresh = null;
  });

  describe("Token Rotation & Sessions", () => {
    it("should register, login, and rotate refresh tokens", async () => {
      const email = "tester@example.com";
      const password = "password123";

      // 1. Register
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue({ id: "t1" });
      const registeredUser = {
        id: "u1",
        email,
        name: "Tester",
        role: "ORGANIZER",
        tenantId: "t1",
      };
      mockPrismaService.user.create.mockResolvedValue(registeredUser);
      mockPrismaService.user.update.mockResolvedValue({ id: "u1" });
      userForRefresh = {
        ...registeredUser,
        tenant: { id: "t1" },
        speaker: null,
      };

      const regRes = await request(app.getHttpServer())
        .post("/auth/register-organizer")
        .send({
          tenantName: "Test Org",
          tenantSlug: "test-org",
          name: "Tester",
          email,
          password,
        })
        .expect(201);

      expect(regRes.body.access_token).toBeDefined();
      expect(regRes.body.refresh_token).toBeDefined();
      const firstRefreshToken = regRes.body.refresh_token;

      // 2. Refresh - the in-memory store resolves the hash lookup and rotation.
      const refreshRes = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refresh_token: firstRefreshToken })
        .expect(201);

      expect(refreshRes.body.access_token).toBeDefined();
      expect(refreshRes.body.refresh_token).toBeDefined();
      const secondRefreshToken = refreshRes.body.refresh_token;

      // The first refresh token record must be revoked after rotation.
      expect(refreshTokens[0].revokedAt).not.toBeNull();

      // 3. Logout with the new refresh token (bearer only triggers guard, not rotation).
      await request(app.getHttpServer())
        .post("/auth/logout")
        .set("Authorization", `Bearer ${refreshRes.body.access_token}`)
        .send({ refresh_token: secondRefreshToken })
        .expect(201);

      // The second refresh token is now revoked in-memory.
      expect(
        refreshTokens.find(
          (t) => t.tokenHash && t.userId === "u1" && t.revokedAt !== null,
        ),
      ).toBeDefined();

      // 4. Trying to refresh after logout must fail with 401.
      await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refresh_token: secondRefreshToken })
        .expect(401);
    });

    it("should allow ORGANIZER with isSpeaker flag to access SPEAKER routes", async () => {
      const jwtService = app.get(JwtService);

      const payload = {
        sub: "u_hybrid",
        email: "hybrid@example.com",
        role: "ORGANIZER",
        tenantId: "t1",
        isSpeaker: true,
      };

      const accessToken = await jwtService.signAsync(payload);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...payload,
        id: payload.sub,
      });

      mockPrismaService.speaker.findUnique = jest.fn().mockResolvedValue({
        id: "s1",
        userId: "u_hybrid",
        tenantId: "t1",
        name: "Hybrid Speaker",
      });

      // Simular acesso ao endpoint /speakers/me que exige role SPEAKER
      // O RolesGuard deve permitir por causa da flag isSpeaker: true
      await request(app.getHttpServer())
        .get("/speakers/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe("Password Recovery", () => {
    it("should handle password recovery flow", async () => {
      const email = "recover@example.com";

      // 1. Forgot Password
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "u2",
        email,
        name: "Recover Tester",
      });
      mockPrismaService.user.update.mockResolvedValue({ id: "u2" });
      mockMailService.enqueue.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post("/auth/forgot-password")
        .send({ email })
        .expect(201);

      // 2. Reset Password
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: "u2",
        email,
      });
      mockPrismaService.user.update.mockResolvedValue({ id: "u2" });

      await request(app.getHttpServer())
        .post("/auth/reset-password")
        .send({
          token: "valid_reset_token",
          newPassword: "newpassword123",
        })
        .expect(201);
    });
  });
});
