import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { getQueueToken } from "@nestjs/bullmq";
import { ActivitiesProcessor } from "./../src/activities/activities.processor";
import { AssignReviewsProcessor } from "./../src/submissions/submissions.processor";
import { MailProcessor } from "./../src/mail/mail.processor";
import { KanbanAlertsProcessor } from "./../src/kanban/kanban.processor";
import { KanbanAutomationService } from "./../src/kanban/kanban-automation.service";

describe("Activities (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    event: {
      findFirst: jest.fn(),
    },
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    activitySpeaker: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    activityEnrollment: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    registration: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    attendance: {
      deleteMany: jest.fn(),
    },
    activityType: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "log_1" }),
    },
  };

  const mockQueue = {
    add: jest.fn(),
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
      .overrideProvider(ActivitiesProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(AssignReviewsProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(MailProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(getQueueToken("kanban-alerts"))
      .useValue(mockQueue)
      .overrideProvider(KanbanAlertsProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(KanbanAutomationService)
      .useValue({
        handleActivityUpsert: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    const fetchTenant = () => {
      // Default mock resolutions to avoid TypeErrors
      mockPrismaService.event.findFirst.mockResolvedValue({
        id: "e1",
        tenantId: "tenant_1",
      });
      mockPrismaService.activity.create.mockResolvedValue({
        id: "a1",
        requiresEnrollment: true,
      });
      mockPrismaService.activity.findMany.mockResolvedValue([]);
      mockPrismaService.activity.findFirst.mockResolvedValue({
        id: "a1",
        speakers: [],
        enrollments: [],
      });
      mockPrismaService.activity.findUnique.mockResolvedValue({
        id: "a1",
        eventId: "e1",
        speakers: [],
        enrollments: [],
      });
      mockPrismaService.registration.findMany.mockResolvedValue([]);
      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([]);
      mockPrismaService.activityEnrollment.findFirst.mockResolvedValue(null);
      mockPrismaService.activityEnrollment.create.mockResolvedValue({
        id: "en1",
      });
      mockPrismaService.activityEnrollment.createMany.mockResolvedValue({
        count: 0,
      });
    };

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
    fetchTenant();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("POST /events/:eventId/activities", () => {
    it("should create an activity (Organizer)", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        email: "org@test.com",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.event.findFirst.mockResolvedValue({
        id: "e1",
        tenantId: "tenant_1",
      });
      mockPrismaService.activity.create.mockResolvedValue({
        id: "a1",
        requiresEnrollment: true,
      });
      mockPrismaService.activity.findFirst.mockResolvedValue({
        // Result of getActivityForTenant
        id: "a1",
        title: "Title",
        speakers: [],
        enrollments: [],
      });

      return request(app.getHttpServer())
        .post("/events/e1/activities")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Workshop",
          startAt: new Date().toISOString(),
          endAt: new Date().toISOString(),
          requiresEnrollment: true,
        })
        .expect(201)
        .then((response) => {
          expect(response.body.title).toBe("Title");
        });
    });
  });

  describe("POST /activities/:activityId/enroll", () => {
    it("should enroll a participant successfully", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        email: "user@test.com",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      const activity = {
        id: "a1",
        eventId: "e1",
        startAt: new Date("2023-01-01T10:00:00Z"),
        endAt: new Date("2023-01-01T12:00:00Z"),
        capacity: 10,
        enrollments: [],
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(activity);
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg1",
      });
      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([]);
      mockPrismaService.activityEnrollment.findFirst.mockResolvedValue(null);
      mockPrismaService.activityEnrollment.create.mockResolvedValue({
        id: "enc1",
      });

      return request(app.getHttpServer())
        .post("/activities/a1/enroll")
        .set("Authorization", `Bearer ${token}`)
        .expect(201);
    });

    it("should block enrollment due to time conflict", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        email: "user@test.com",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      const activity = {
        id: "a1",
        eventId: "e1",
        startAt: new Date("2023-01-01T10:00:00Z"),
        endAt: new Date("2023-01-01T12:00:00Z"),
        capacity: 10,
        enrollments: [],
      };

      mockPrismaService.activity.findUnique.mockResolvedValue(activity);
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg1",
      });

      // Conflicting enrollment
      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([
        {
          activity: {
            startAt: new Date("2023-01-01T11:00:00Z"),
            endAt: new Date("2023-01-01T13:00:00Z"),
          },
        },
      ]);

      return request(app.getHttpServer())
        .post("/activities/a1/enroll")
        .set("Authorization", `Bearer ${token}`)
        .expect(403)
        .then((response) => {
          expect(response.body.message).toContain("conflita");
        });
    });
  });

  describe("GET /events/:eventId/activities", () => {
    it("should list activities for an event", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        email: "org@test.com",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.event.findFirst.mockResolvedValue({
        id: "e1",
        tenantId: "tenant_1",
      });
      mockPrismaService.activity.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get("/events/e1/activities")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });

  describe("PATCH /activities/:activityId", () => {
    it("should update an activity", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        email: "org@test.com",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.activity.findFirst.mockResolvedValue({
        id: "a1",
        speakers: [],
        enrollments: [],
        event: { tenantId: "tenant_1" },
      });
      mockPrismaService.activity.findUnique.mockResolvedValue({
        id: "a1",
        eventId: "e1",
        speakers: [],
        enrollments: [],
      });

      return request(app.getHttpServer())
        .patch("/activities/a1")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "New Title" })
        .expect(200);
    });
  });

  describe("Activity Management & Enrollments", () => {
    it("should list my enrollments for an event", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.activity.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get("/activities/my-enrollments/e1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("should unroll from an activity", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.activity.findUnique.mockResolvedValue({
        id: "a1",
        eventId: "e1",
        startAt: new Date(),
        endAt: new Date(),
        enrollments: [],
      });
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg1",
      });
      mockPrismaService.activityEnrollment.findFirst.mockResolvedValue({
        id: "en1",
      });
      mockPrismaService.activityEnrollment.delete.mockResolvedValue({
        id: "en1",
      });

      return request(app.getHttpServer())
        .delete("/activities/a1/unroll")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("should delete an activity (Organizer)", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.activity.findFirst.mockResolvedValue({ id: "a1" });
      mockPrismaService.activitySpeaker.deleteMany.mockResolvedValue({
        count: 0,
      });
      mockPrismaService.activityEnrollment.deleteMany.mockResolvedValue({
        count: 0,
      });
      mockPrismaService.attendance.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.activity.delete.mockResolvedValue({ id: "a1" });

      return request(app.getHttpServer())
        .delete("/activities/a1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("should list all enrollments for an activity (Organizer)", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.activity.findFirst.mockResolvedValue({
        id: "a1",
        event: { tenantId: "tenant_1" },
        speakers: [],
        type: null,
        enrollments: [],
      });
      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get("/activities/a1/enrollments")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("should confirm an enrollment (Organizer)", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.activity.findFirst.mockResolvedValue({
        id: "a1",
        speakers: [],
        type: null,
        enrollments: [],
      });
      mockPrismaService.activityEnrollment.findUnique.mockResolvedValue({
        id: "en1",
        activityId: "a1",
        status: "PENDING",
      });
      mockPrismaService.activityEnrollment.update.mockResolvedValue({
        id: "en1",
        status: "CONFIRMED",
      });

      return request(app.getHttpServer())
        .post("/activities/a1/enrollments/en1/confirm")
        .set("Authorization", `Bearer ${token}`)
        .expect(201);
    });
  });

  describe("Activity Types (Full CRUD)", () => {
    it("should list all activity types", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.activityType.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get("/activities/types")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("should delete an activity type", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.activityType.findFirst.mockResolvedValue({
        id: "t1",
        tenantId: "tenant_1",
      });
      mockPrismaService.activityType.delete.mockResolvedValue({ id: "t1" });

      return request(app.getHttpServer())
        .delete("/activities/types/t1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });
});
