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

describe("Sponsors (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    event: {
      findFirst: jest.fn(),
    },
    sponsorCategory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    sponsor: {
      findMany: jest.fn(),
    },
  };

  const mockQueue = { add: jest.fn() };

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
      .overrideProvider(ActivitiesProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(AssignReviewsProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(MailProcessor)
      .useValue({ process: jest.fn() })
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

  describe("POST /events/:id/sponsors/categories", () => {
    it("should create a sponsor category (Organizer)", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.sponsorCategory.create.mockResolvedValue({
        id: "c1",
        name: "Gold",
      });

      return request(app.getHttpServer())
        .post("/sponsors/categories/e1")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Gold" })
        .expect(201);
    });
  });

  describe("GET /events/:id/sponsors/categories", () => {
    it("should list categories", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.sponsorCategory.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get("/sponsors/categories/e1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });
});
