import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";
import { ActivitiesProcessor } from "./../src/activities/activities.processor";
import { AssignReviewsProcessor } from "./../src/submissions/submissions.processor";
import { MailProcessor } from "./../src/mail/mail.processor";
import { KanbanAlertsProcessor } from "./../src/kanban/kanban.processor";
import { getQueueToken } from "@nestjs/bullmq";
import { CustomValidationPipe } from "./../src/common/pipes/validation.pipe";
import { HttpExceptionFilter } from "./../src/common/filters/http-exception.filter";

describe("AuthController (e2e)", () => {
  let app: INestApplication;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({ id: "rt_1" }),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
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
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("/auth/register-organizer (POST) should succeed with valid payload", () => {
    const registerDto = {
      tenantName: "Test Tenant",
      tenantSlug: "test-tenant",
      name: "Organizer",
      email: "org@example.com",
      password: "password123",
    };

    mockPrismaService.user.findUnique.mockResolvedValue(null);
    mockPrismaService.tenant.create.mockResolvedValue({ id: "tenant_1" });
    mockPrismaService.user.create.mockResolvedValue({
      id: "user_1",
      ...registerDto,
      role: "ORGANIZER",
      tenantId: "tenant_1",
      mustChangePassword: false,
    });
    mockPrismaService.refreshToken.create.mockResolvedValue({ id: "rt_1" });

    return request(app.getHttpServer())
      .post("/auth/register-organizer")
      .send(registerDto)
      .expect(201)
      .then((response) => {
        expect(response.body).toHaveProperty("access_token");
        expect(response.body.user.email).toBe(registerDto.email);
      });
  });

  it("/auth/register-organizer (POST) should return 400 on invalid payload", () => {
    return request(app.getHttpServer())
      .post("/auth/register-organizer")
      .send({ tenantName: "", tenantSlug: "x", name: "n", email: "not-email" })
      .expect(400);
  });

  it("/auth/login (POST) should return 400 when email missing", () => {
    return request(app.getHttpServer())
      .post("/auth/login")
      .send({ password: "x" })
      .expect(400);
  });

  it("/health (GET) should return 200 without authentication", () => {
    return request(app.getHttpServer())
      .get("/health")
      .expect(200)
      .then((response) => {
        expect(response.body.status).toBe("ok");
      });
  });
});
