import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ActivitiesProcessor } from "./../src/activities/activities.processor";
import { AssignReviewsProcessor } from "./../src/submissions/submissions.processor";
import { MailProcessor } from "./../src/mail/mail.processor";
import { KanbanAlertsProcessor } from "./../src/kanban/kanban.processor";
import { getQueueToken } from "@nestjs/bullmq";

describe("AuditController (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    auditLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    event: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
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
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /events/:eventId/audit", () => {
    it("should return audit logs for an authorized organizer", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.auditLog.findMany.mockResolvedValue([
        { id: "log_1", action: "UPDATE_EVENT", user: { name: "User 1" } },
      ]);

      return request(app.getHttpServer())
        .get("/events/event_1/audit")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body[0]).toHaveProperty("action", "UPDATE_EVENT");
        });
    });

    it("should return 403 for unauthorized users (e.g. PARTICIPANT)", async () => {
      const token = await jwtService.signAsync({
        sub: "user_2",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      return request(app.getHttpServer())
        .get("/events/event_1/audit")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });

  describe("AuditInterceptor Integration", () => {
    it("should create audit log when a mutation occurs on EventsController", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.event.findFirst.mockResolvedValue({
        id: "event_1",
        tenantId: "tenant_1",
      });
      mockPrismaService.event.update.mockResolvedValue({ id: "event_1" });
      mockPrismaService.auditLog.create.mockResolvedValue({ id: "log_1" });

      // We trigger a mutation on a different controller (EventsController)
      // to verify the GLOBAL AuditInterceptor is working.
      await request(app.getHttpServer())
        .patch("/events/event_1")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated name" })
        .expect(200);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user_1",
            action: "PATCH_EVENTS",
            resource: "Events",
          }),
        }),
      );
    });
  });
});
