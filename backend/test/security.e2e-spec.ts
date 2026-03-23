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

describe("Security (e2e) - Multi-Tenancy Isolation", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    event: {
      findFirst: jest.fn(),
    },
    activity: {
      findFirst: jest.fn(),
    },
    submission: {
      findFirst: jest.fn(),
    },
    registration: {
      findFirst: jest.fn(),
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

  describe("Cross-Tenant Data Isolation", () => {
    it("should block Organizer from accessing another tenant's event activities", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_A",
        role: "ORGANIZER",
      });

      // Mock finding event: findFirst returns null because event belongs to tenant_B
      mockPrismaService.event.findFirst.mockResolvedValue(null);

      // Attempt to list activities for an event that doesn't belong to the organizer's tenant
      return request(app.getHttpServer())
        .get("/events/event_of_tenant_B/activities")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should block Organizer from updating another tenant's activity", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_A",
        role: "ORGANIZER",
      });

      // getActivityForTenant uses findFirst with { id, event: { tenantId } }
      mockPrismaService.activity.findFirst.mockResolvedValue(null);

      return request(app.getHttpServer())
        .patch("/activities/activity_of_tenant_B")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Hack" })
        .expect(404); // getActivityForTenant throws NotFound if not found in tenant
    });

    it("should block Organizer from listing submissions of another tenant's event", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_A",
        role: "ORGANIZER",
      });

      mockPrismaService.event.findFirst.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get("/events/event_of_tenant_B/submissions")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });
});
