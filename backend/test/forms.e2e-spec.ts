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

describe("Forms (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    event: {
      findFirst: jest.fn(),
    },
    customForm: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customFormField: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

  describe("GET /events/:eventId/registration-form", () => {
    it("should return registration form for organizer", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.customForm.findFirst.mockResolvedValue({
        id: "f1",
        fields: [],
      });

      return request(app.getHttpServer())
        .get("/events/e1/registration-form")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });

  describe("POST /events/:eventId/registration-form", () => {
    it("should save registration form for organizer", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.customForm.findFirst.mockResolvedValueOnce(null); // First call for existence check
      mockPrismaService.customForm.create.mockResolvedValue({
        id: "f1",
        name: "Reg Form",
      });
      mockPrismaService.customFormField.findMany.mockResolvedValue([]);
      mockPrismaService.customFormField.deleteMany.mockResolvedValue({
        count: 0,
      });
      mockPrismaService.customFormField.create.mockResolvedValue({ id: "ff1" });

      // Final return call in service
      mockPrismaService.customForm.findFirst.mockResolvedValueOnce({
        id: "f1",
        fields: [],
      });

      return request(app.getHttpServer())
        .post("/events/e1/registration-form")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Reg Form",
          fields: [{ label: "Email", type: "TEXT", required: true, order: 1 }],
        })
        .expect(201);
    });

    it("should block participants from saving forms", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      return request(app.getHttpServer())
        .post("/events/e1/registration-form")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Hack" })
        .expect(403);
    });
  });
});
