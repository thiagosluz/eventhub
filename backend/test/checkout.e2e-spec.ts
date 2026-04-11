import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

import { BadgesService } from "./../src/badges/badges.service";
import { MailService } from "./../src/mail/mail.service";
import { ActivitiesProcessor } from "./../src/activities/activities.processor";
import { AssignReviewsProcessor } from "./../src/submissions/submissions.processor";
import { MailProcessor } from "./../src/mail/mail.processor";
import { KanbanAlertsProcessor } from "./../src/kanban/kanban.processor";
import { getQueueToken } from "@nestjs/bullmq";

describe("CheckoutController (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
    },
    registration: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
    },
    ticket: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    activityEnrollment: {
      createMany: jest.fn(),
    },
    customFormResponse: {
      create: jest.fn(),
    },
    customFormAnswer: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "log_1" }),
    },
  };
  const mockQueue = { add: jest.fn() };

  const mockBadgesService = {
    checkAndAwardBadge: jest.fn(),
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
      .overrideProvider(BadgesService)
      .useValue(mockBadgesService)
      .overrideProvider(MailService)
      .useValue(mockMailService)
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

  it("/checkout (POST) - Success", async () => {
    const token = await jwtService.signAsync({
      sub: "user_1",
      email: "user@example.com",
      tenantId: "tenant_1",
      role: "PARTICIPANT",
    });

    const checkoutDto = {
      eventId: "event_1",
      activityIds: [],
    };

    mockPrismaService.event.findUnique.mockResolvedValue({
      id: "event_1",
      name: "Test Event",
    });
    mockPrismaService.registration.findFirst.mockResolvedValue(null);
    mockPrismaService.registration.create.mockResolvedValue({ id: "reg_1" });
    mockPrismaService.activity.findMany.mockResolvedValue([]);
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "user@example.com",
    });
    mockPrismaService.ticket.create.mockResolvedValue({
      id: "ticket_1",
      type: "FREE",
      status: "COMPLETED",
    });

    return request(app.getHttpServer())
      .post("/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send(checkoutDto)
      .expect(201)
      .then((response) => {
        expect(response.body).toHaveProperty("registrationId");
        expect(response.body).toHaveProperty("tickets");
        expect(Array.isArray(response.body.tickets)).toBe(true);
      });
  });

  it("/checkout (POST) - Conflict (Already Registered)", async () => {
    const token = await jwtService.signAsync({
      sub: "user_1",
      email: "user@example.com",
      tenantId: "tenant_1",
      role: "PARTICIPANT",
    });

    const checkoutDto = {
      eventId: "event_1",
    };

    mockPrismaService.event.findUnique.mockResolvedValue({ id: "event_1" });
    mockPrismaService.registration.findFirst.mockResolvedValue({
      id: "existing_reg",
    });

    return request(app.getHttpServer())
      .post("/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send(checkoutDto)
      .expect(409);
  });
});
