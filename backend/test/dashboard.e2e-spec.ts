import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

describe("Dashboard (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    ticket: {
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    registration: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    event: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
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

  describe("GET /dashboard/stats", () => {
    it("should return 200 and stats for Organizer", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        email: "org@test.com",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.ticket.aggregate.mockResolvedValue({
        _sum: { price: 1000 },
      });
      mockPrismaService.registration.count.mockResolvedValue(50);
      mockPrismaService.event.count.mockResolvedValue(5);
      mockPrismaService.ticket.count.mockResolvedValue(40);
      mockPrismaService.registration.findMany.mockResolvedValue([]);
      mockPrismaService.event.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get("/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .then((response) => {
          expect(response.body.totalRevenue).toBe(1000);
          expect(response.body.totalRegistrations).toBe(50);
        });
    });

    it("should return 403 for Participant", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        email: "user@test.com",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      return request(app.getHttpServer())
        .get("/dashboard/stats")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });
});
