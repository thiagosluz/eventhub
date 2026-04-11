import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { PrismaService } from "./../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { MinioService } from "./../src/storage/minio.service";
import { MailService } from "./../src/mail/mail.service";
import { MailProcessor } from "./../src/mail/mail.processor";
import { KanbanAlertsProcessor } from "./../src/kanban/kanban.processor";
import { getQueueToken } from "@nestjs/bullmq";
import { AssignReviewsProcessor } from "./../src/submissions/submissions.processor";

describe("Submissions (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    submission: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    review: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: "log_1" }),
    },
  };

  const mockMinioService = {
    uploadObject: jest.fn(),
  };

  const mockMailService = {
    enqueue: jest.fn(),
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
      .overrideProvider(MinioService)
      .useValue(mockMinioService)
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .overrideProvider(getQueueToken("assign-reviews"))
      .useValue(mockQueue)
      .overrideProvider(AssignReviewsProcessor)
      .useValue({})
      .overrideProvider(MailProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(getQueueToken("kanban-alerts"))
      .useValue(mockQueue)
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
    if (app) {
      await app.close();
    }
  });

  describe("POST /submissions", () => {
    it("should create a submission (Participant)", async () => {
      const token = await jwtService.signAsync({
        sub: "author_1",
        email: "author@test.com",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.event.findUnique.mockResolvedValue({
        id: "event_1",
        tenantId: "tenant_1",
        submissionsEnabled: true,
      });
      mockMinioService.uploadObject.mockResolvedValue("http://minio/file");
      mockPrismaService.submission.create.mockResolvedValue({
        id: "sub_1",
        title: "My Paper",
        author: { name: "Author", email: "author@test.com" },
        event: { name: "Event" },
      });

      return request(app.getHttpServer())
        .post("/submissions")
        .set("Authorization", `Bearer ${token}`)
        .field("eventId", "event_1")
        .field("title", "My Paper")
        .attach("file", Buffer.from("pdf content"), "paper.pdf")
        .expect(201)
        .then((response) => {
          expect(response.body.id).toBe("sub_1");
          expect(mockQueue.add).toHaveBeenCalled();
        });
    });
  });

  describe("GET /events/:id/submissions", () => {
    it("should list submissions (Organizer)", async () => {
      const token = await jwtService.signAsync({
        sub: "org_1",
        email: "org@test.com",
        tenantId: "tenant_1",
        role: "ORGANIZER",
      });

      mockPrismaService.event.findFirst.mockResolvedValue({ id: "event_1" });
      mockPrismaService.submission.findMany.mockResolvedValue([
        { id: "sub_1", title: "Sub 1", reviews: [] },
      ]);

      return request(app.getHttpServer())
        .get("/events/event_1/submissions")
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body[0].title).toBe("Sub 1");
        });
    });
  });

  describe("POST /reviews", () => {
    it("should submit a review (Reviewer)", async () => {
      const token = await jwtService.signAsync({
        sub: "rev_1",
        email: "rev@test.com",
        tenantId: "tenant_1",
        role: "REVIEWER",
      });

      mockPrismaService.review.findFirst.mockResolvedValue({
        id: "rev_rec_1",
        submission: {
          event: {
            reviewEndDate: null,
          },
        },
      });
      mockPrismaService.review.update.mockResolvedValue({
        id: "rev_rec_1",
        score: 4,
      });

      return request(app.getHttpServer())
        .post("/reviews")
        .set("Authorization", `Bearer ${token}`)
        .send({
          submissionId: "sub_1",
          score: 4,
          recommendation: "ACCEPT",
          comments: "Great work!",
        })
        .expect(201);
    });
  });
  describe("My Submissions & Reviews", () => {
    it("should list my assigned reviews (Reviewer)", async () => {
      const token = await jwtService.signAsync({
        sub: "rev_1",
        tenantId: "tenant_1",
        role: "REVIEWER",
      });

      mockPrismaService.review.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get("/me/reviews")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("should list my submissions (Author)", async () => {
      const token = await jwtService.signAsync({
        sub: "author_1",
        tenantId: "tenant_1",
        role: "PARTICIPANT",
      });

      mockPrismaService.submission.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .get("/me/submissions")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });
});
