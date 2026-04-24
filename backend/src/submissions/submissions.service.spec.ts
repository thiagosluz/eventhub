import { Test, TestingModule } from "@nestjs/testing";
import { SubmissionsService } from "./submissions.service";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { MailService } from "../mail/mail.service";
import { getQueueToken } from "@nestjs/bullmq";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { GamificationService } from "../gamification/gamification.service";

describe("SubmissionsService", () => {
  let service: SubmissionsService;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    submission: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    eventReviewer: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

  const mockGamificationService = {
    getXpForAction: jest.fn().mockResolvedValue(200),
    awardXp: jest.fn().mockResolvedValue({ xpGained: 200, isLevelUp: false }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MinioService, useValue: mockMinioService },
        { provide: MailService, useValue: mockMailService },
        { provide: getQueueToken("assign-reviews"), useValue: mockQueue },
        { provide: GamificationService, useValue: mockGamificationService },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createSubmission", () => {
    it("should create submission and enqueue background job", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: "e1",
        tenantId: "t1",
        submissionsEnabled: true,
        submissionStartDate: null,
        submissionEndDate: null,
      });
      mockMinioService.uploadObject.mockResolvedValue("http://file.com");
      mockPrismaService.submission.create.mockResolvedValue({
        id: "s1",
        title: "T",
        author: { name: "A", email: "a@test.com" },
        event: { name: "E" },
      });

      const params = {
        authorId: "u1",
        eventId: "e1",
        title: "T",
        file: { buffer: Buffer.from(""), mimetype: "application/pdf" },
      };

      await service.createSubmission(params);

      expect(mockPrismaService.submission.create).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalled();
    });
  });

  describe("listSubmissionsForEvent", () => {
    it("should throw Forbidden if event not in tenant", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(service.listSubmissionsForEvent("t1", "e1")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should return submissions", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.submission.findMany.mockResolvedValue([
        { id: "s1", title: "T" },
      ]);
      const result = await service.listSubmissionsForEvent("t1", "e1");
      expect(result).toHaveLength(1);
    });
  });

  describe("My Submissions and Reviews", () => {
    it("should list author's submissions", async () => {
      mockPrismaService.submission.findMany.mockResolvedValue([{ id: "s1" }]);
      const result = await service.listMySubmissions("u1");
      expect(result).toHaveLength(1);
    });

    it("should list reviews assigned to reviewer", async () => {
      mockPrismaService.review.findMany.mockResolvedValue([
        {
          id: "r1",
          submissionId: "s1",
          submission: { title: "T", event: { id: "e1", name: "E" } },
        },
      ]);
      const result = await service.listAssignedToReviewer("rev1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("r1");
      expect(result[0].submission.title).toBe("T");
    });
  });

  describe("submitReview", () => {
    it("should update review if assigned", async () => {
      mockPrismaService.review.findFirst.mockResolvedValue({
        id: "r1",
        submission: {
          event: {
            reviewEndDate: null,
          },
        },
      });
      mockPrismaService.review.update.mockResolvedValue({ id: "r1" });
      await service.submitReview({
        reviewerId: "rev1",
        submissionId: "s1",
        score: 5,
      });
      expect(mockPrismaService.review.update).toHaveBeenCalled();
    });

    it("should throw Forbidden if not assigned", async () => {
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      await expect(
        service.submitReview({ reviewerId: "rev1", submissionId: "s1" }),
      ).rejects.toThrow(ForbiddenException);
    });
    it("should throw NotFound if event does not exist", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(
        service.createSubmission({ eventId: "e1" } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw Forbidden if submissions disabled", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: "e1",
        submissionsEnabled: false,
      });
      await expect(
        service.createSubmission({ eventId: "e1" } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw Forbidden if submission period not started", async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: "e1",
        submissionsEnabled: true,
        submissionStartDate: future,
      });
      await expect(
        service.createSubmission({ eventId: "e1" } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw Forbidden if submission period ended", async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: "e1",
        submissionsEnabled: true,
        submissionEndDate: past,
      });
      await expect(
        service.createSubmission({ eventId: "e1" } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("submitReview - deadline", () => {
    it("should throw Forbidden if review deadline ended", async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      mockPrismaService.review.findFirst.mockResolvedValue({
        id: "r1",
        submission: { event: { reviewEndDate: past } },
      });
      await expect(
        service.submitReview({ reviewerId: "rev1", submissionId: "s1" }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("Reviewer Management", () => {
    it("should list event reviewers", async () => {
      mockPrismaService.eventReviewer.findMany.mockResolvedValue([
        {
          user: { id: "u1", name: "R1" },
        },
      ]);
      const result = await service.listEventReviewers("e1");
      expect(result[0].name).toBe("R1");
    });

    it("should add reviewer to event", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "u1",
        role: "REVIEWER",
      });
      mockPrismaService.eventReviewer.upsert.mockResolvedValue({});
      await service.addReviewerToEvent("e1", "u1");
      expect(mockPrismaService.eventReviewer.upsert).toHaveBeenCalled();
    });

    it("should throw NotFound if adding non-existent user", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.addReviewerToEvent("e1", "u1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw Forbidden if adding non-reviewer", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "u1",
        role: "USER",
      });
      await expect(service.addReviewerToEvent("e1", "u1")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should remove reviewer from event", async () => {
      mockPrismaService.eventReviewer.deleteMany.mockResolvedValue({});
      await service.removeReviewerFromEvent("e1", "u1");
      expect(mockPrismaService.eventReviewer.deleteMany).toHaveBeenCalled();
    });

    it("should manual assign review", async () => {
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue({ id: "r1" });
      await service.manualAssignReview("s1", "rev1");
      expect(mockPrismaService.review.create).toHaveBeenCalled();
    });

    it("should return early if manual assign review already exists", async () => {
      mockPrismaService.review.findFirst.mockResolvedValue({ id: "r1" });
      mockPrismaService.review.create.mockClear();
      const result = await service.manualAssignReview("s1", "rev1");
      expect(result.id).toBe("r1");
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });

    it("should delete review", async () => {
      mockPrismaService.review.delete.mockResolvedValue({});
      await service.deleteReview("r1");
      expect(mockPrismaService.review.delete).toHaveBeenCalled();
    });
  });
});
