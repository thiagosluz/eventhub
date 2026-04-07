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

describe("Speakers (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    speaker: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    activitySpeaker: {
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "log_1" }),
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

  describe("POST /speakers", () => {
    it("should create a speaker (Organizer)", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.speaker.create.mockResolvedValue({
        id: "s1",
        name: "Speaker",
      });

      return request(app.getHttpServer())
        .post("/speakers")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Speaker", email: "speaker@test.com" })
        .expect(201);
    });
  });

  describe("GET /speakers/me", () => {
    it("should return my speaker profile", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "SPEAKER",
      });

      mockPrismaService.speaker.findUnique.mockResolvedValue({
        id: "s1",
        name: "My Profile",
      });

      return request(app.getHttpServer())
        .get("/speakers/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .then((response) => {
          expect(response.body.name).toBe("My Profile");
        });
    });
  });
});
