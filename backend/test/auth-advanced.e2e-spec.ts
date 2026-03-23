import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { MailService } from "../src/mail/mail.service";

describe("Auth Advanced (e2e)", () => {
  let app: INestApplication;

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
  };

  const mockMailService = {
    enqueue: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
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

  describe("Token Rotation & Sessions", () => {
    it("should register, login, and rotate refresh tokens", async () => {
      const email = "tester@example.com";
      const password = "password123";

      // 1. Register
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue({ id: "t1" });
      mockPrismaService.user.create.mockResolvedValue({
        id: "u1",
        email,
        name: "Tester",
        role: "ORGANIZER",
        tenantId: "t1",
      });
      mockPrismaService.user.update.mockResolvedValue({ id: "u1" });

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

      // 2. Refresh
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: "u1",
        email,
        role: "ORGANIZER",
        tenantId: "t1",
      });
      mockPrismaService.user.update.mockResolvedValue({ id: "u1" });

      const refreshRes = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refresh_token: firstRefreshToken })
        .expect(201);

      expect(refreshRes.body.access_token).toBeDefined();
      expect(refreshRes.body.refresh_token).toBeDefined();
      const secondRefreshToken = refreshRes.body.refresh_token;

      // 3. Logout
      mockPrismaService.user.update.mockResolvedValue({
        id: "u1",
        refreshToken: null,
      });

      await request(app.getHttpServer())
        .post("/auth/logout")
        .set("Authorization", `Bearer ${refreshRes.body.access_token}`)
        .expect(201);

      // 4. Try refresh after logout (Prisma findFirst returns null if token is cleared or doesn't match)
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refresh_token: secondRefreshToken })
        .expect(401);
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
