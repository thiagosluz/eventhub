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

describe("Badges (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    badge: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    userBadge: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    registration: {
      findMany: jest.fn(),
    },
  };

  const mockQueue = { add: jest.fn() };

  beforeEach(async () => {
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

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("GET /badges/my", () => {
    it("should return user badges", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.userBadge.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get("/badges/my")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });

  describe("POST /badges/event/:eventId (Organizer only)", () => {
    it("should create a badge for organizer", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.badge.create.mockResolvedValue({
        id: "b1",
        name: "Badge",
      });

      return request(app.getHttpServer())
        .post("/badges/event/e1")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Badge", triggerRule: "MANUAL" })
        .expect(201);
    });

    it("should block participants from creating badges", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      return request(app.getHttpServer())
        .post("/badges/event/e1")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Hack" })
        .expect(403);
    });
  });

  describe("POST /badges/claim/:id", () => {
    it("should allow participant to claim a badge", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.badge.findUnique.mockResolvedValue({
        id: "b1",
        triggerRule: "MANUAL",
        manualDeliveryMode: "GLOBAL_CODE",
        claimCode: "SECRET",
      });
      mockPrismaService.userBadge.findUnique.mockResolvedValue(null);
      mockPrismaService.userBadge.create.mockResolvedValue({ id: "ub1" });

      return request(app.getHttpServer())
        .post("/badges/claim/b1")
        .set("Authorization", `Bearer ${token}`)
        .send({ claimCode: "SECRET" })
        .expect(201);
    });
  });
});
