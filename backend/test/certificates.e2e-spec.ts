import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { MinioService } from "./../src/storage/minio.service";
import { MailService } from "./../src/mail/mail.service";
import { ActivitiesProcessor } from "./../src/activities/activities.processor";
import { AssignReviewsProcessor } from "./../src/submissions/submissions.processor";
import { MailProcessor } from "./../src/mail/mail.processor";
import { KanbanAlertsProcessor } from "./../src/kanban/kanban.processor";
import { getQueueToken } from "@nestjs/bullmq";

// 1x1 transparent PNG for E2E
const validPngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
);

(global as any).fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    arrayBuffer: () => Promise.resolve(new Uint8Array(validPngBuffer).buffer),
  }),
);

describe("Certificates (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    event: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    certificateTemplate: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    registration: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
    },
    issuedCertificate: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    activity: {
      findMany: jest.fn(),
    },
    activitySpeaker: {
      findFirst: jest.fn(),
    },
    eventMonitor: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    review: {
      count: jest.fn(),
    },
    thematicArea: {
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "log_1" }),
    },
  };
  const mockQueue = { add: jest.fn() };

  const mockMinioService = {
    uploadObject: jest.fn(),
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
      .overrideProvider(MinioService)
      .useValue(mockMinioService)
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

  describe("POST /certificates/templates/:templateId/issue-bulk", () => {
    it("should issue bulk certificates for PARTICIPANTS", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        email: "org@test.com",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      const template = {
        id: "tmpl_p",
        eventId: "event_1",
        category: "PARTICIPANT",
        event: { name: "E1", startDate: new Date(), endDate: new Date() },
      };

      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue(
        template,
      );
      mockPrismaService.registration.findMany.mockResolvedValue([
        {
          id: "reg_1",
          userId: "user_1",
          user: { name: "U1", email: "u1@test.com" },
        },
      ]);
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg_1",
        user: { name: "U1", cpf: "123" },
        event: { name: "E1" },
      });
      mockPrismaService.issuedCertificate.findFirst.mockResolvedValue(null);
      mockPrismaService.attendance.findMany.mockResolvedValue([]);
      mockMinioService.uploadObject.mockResolvedValue("url");
      mockPrismaService.issuedCertificate.create.mockResolvedValue({
        id: "i1",
      });

      return request(app.getHttpServer())
        .post("/certificates/templates/tmpl_p/issue-bulk")
        .set("Authorization", `Bearer ${token}`)
        .send({ sendEmail: true })
        .expect(201)
        .then((response) => {
          expect(response.body.processed).toBe(1);
          expect(mockMailService.enqueue).toHaveBeenCalled();
        });
    });

    it("should issue bulk certificates for REVIEWERS", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      const template = {
        id: "tmpl_r",
        eventId: "event_1",
        category: "REVIEWER",
        event: { name: "E1" },
      };

      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue(
        template,
      );
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: "rev_1", name: "R1", email: "r1@test.com" },
      ]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "rev_1",
        name: "R1",
      });
      mockPrismaService.review.count.mockResolvedValue(3);
      mockPrismaService.thematicArea.findMany.mockResolvedValue([
        { name: "Track A" },
      ]);
      mockPrismaService.issuedCertificate.findFirst.mockResolvedValue(null);
      mockMinioService.uploadObject.mockResolvedValue("url");
      mockPrismaService.issuedCertificate.create.mockResolvedValue({
        id: "i1",
      });

      return request(app.getHttpServer())
        .post("/certificates/templates/tmpl_r/issue-bulk")
        .set("Authorization", `Bearer ${token}`)
        .send({}) // Send empty body to verify resilience
        .expect(201)
        .then((response) => {
          expect(response.body.processed).toBe(1);
        });
    });

    it("should issue bulk certificates for MONITORS", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      const template = {
        id: "tmpl_m",
        eventId: "event_1",
        category: "MONITOR",
        event: { name: "E1" },
      };

      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue(
        template,
      );
      mockPrismaService.eventMonitor.findMany.mockResolvedValue([
        { userId: "mon_1", user: { name: "M1", email: "m1@test.com" } },
      ]);
      mockPrismaService.eventMonitor.findFirst.mockResolvedValue({
        userId: "mon_1",
        user: { name: "M1" },
        event: { name: "E1" },
      });
      mockPrismaService.issuedCertificate.findFirst.mockResolvedValue(null);
      mockMinioService.uploadObject.mockResolvedValue("url");
      mockPrismaService.issuedCertificate.create.mockResolvedValue({
        id: "i1",
      });

      return request(app.getHttpServer())
        .post("/certificates/templates/tmpl_m/issue-bulk")
        .set("Authorization", `Bearer ${token}`)
        .expect(201)
        .then((response) => {
          expect(response.body.processed).toBe(1);
        });
    });
  });

  describe("GET /certificates/my", () => {
    it("should list certificates with mixed context", async () => {
      const token = await jwtService.signAsync({
        sub: "user_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.issuedCertificate.findMany.mockResolvedValue([
        {
          id: "i1",
          template: {
            name: "T1",
            category: "PARTICIPANT",
            event: { name: "E1" },
          },
          activity: null,
        },
        {
          id: "i2",
          template: { name: "T2", category: "SPEAKER", event: { name: "E1" } },
          activity: { title: "Talk 1", type: { name: "Lecture" } },
        },
      ]);

      return request(app.getHttpServer())
        .get("/certificates/my")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .then((response) => {
          expect(response.body.length).toBe(2);
          expect(response.body[1].template.category).toBe("SPEAKER");
        });
    });
  });

  describe("GET /certificates/validate/:hash", () => {
    it("should validate a SPEAKER certificate resolving correctly", async () => {
      mockPrismaService.issuedCertificate.findUnique.mockResolvedValue({
        id: "i2",
        validationHash: "hash2",
        issuedAt: new Date(),
        fileUrl: "url",
        registration: null,
        user: { name: "Speaker Name" },
        template: {
          category: "SPEAKER",
          event: { name: "Event 1" },
        },
        activity: { title: "Workshop" },
      });

      return request(app.getHttpServer())
        .get("/certificates/validate/hash2")
        .expect(200)
        .then((response) => {
          expect(response.body.isValid).toBe(true);
          expect(response.body.participantName).toBe("Speaker Name");
          expect(response.body.activityTitle).toBe("Workshop");
        });
    });
  });
});
