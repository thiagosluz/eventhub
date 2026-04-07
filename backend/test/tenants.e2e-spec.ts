import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

describe("Tenants (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    tenant: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "log_1" }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
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

  describe("GET /tenants/public/tenant", () => {
    it("should return public tenant info", () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        name: "EventHub",
        logoUrl: "http://logo.com",
        themeConfig: {},
      });

      return request(app.getHttpServer())
        .get("/tenants/public/tenant")
        .expect(200)
        .then((response) => {
          expect(response.body.name).toBe("EventHub");
        });
    });
  });

  describe("GET /tenants/me", () => {
    it("should return my tenant info (Organizer)", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        email: "org@test.com",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: "tenant_1",
        name: "My Tenant",
      });

      return request(app.getHttpServer())
        .get("/tenants/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .then((response) => {
          expect(response.body.name).toBe("My Tenant");
        });
    });

    it("should block access for non-authenticated users", () => {
      return request(app.getHttpServer()).get("/tenants/me").expect(401);
    });
  });

  describe("PATCH /tenants/me", () => {
    it("should update my tenant info (Organizer)", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        email: "org@test.com",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.tenant.update.mockResolvedValue({
        id: "tenant_1",
        name: "Updated Tenant",
      });

      return request(app.getHttpServer())
        .patch("/tenants/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Tenant" })
        .expect(200)
        .then((response) => {
          expect(response.body.name).toBe("Updated Tenant");
        });
    });

    it("should block update for non-organizers", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        email: "user@test.com",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      return request(app.getHttpServer())
        .patch("/tenants/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Hack" })
        .expect(403);
    });
  });
});
