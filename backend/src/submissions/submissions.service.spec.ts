import { Test, TestingModule } from "@nestjs/testing";
import { SubmissionsService } from "./submissions.service";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { MailService } from "../mail/mail.service";
import { getQueueToken } from "@nestjs/bullmq";
import { ForbiddenException } from "@nestjs/common";

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
    review: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MinioService, useValue: mockMinioService },
        { provide: MailService, useValue: mockMailService },
        { provide: getQueueToken("assign-reviews"), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createSubmission", () => {
    it("should create submission and enqueue background job", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: "e1", tenantId: "t1" });
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
      await expect(service.listSubmissionsForEvent("t1", "e1")).rejects.toThrow(ForbiddenException);
    });

    it("should return submissions", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.submission.findMany.mockResolvedValue([{ id: "s1", title: "T" }]);
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
        { id: "r1", submissionId: "s1", submission: { title: "T", event: { id: "e1", name: "E" } } },
      ]);
      const result = await service.listAssignedToReviewer("rev1");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("T");
    });
  });

  describe("submitReview", () => {
    it("should update review if assigned", async () => {
      mockPrismaService.review.findFirst.mockResolvedValue({ id: "r1" });
      mockPrismaService.review.update.mockResolvedValue({ id: "r1" });
      await service.submitReview({ reviewerId: "rev1", submissionId: "s1", score: 5 });
      expect(mockPrismaService.review.update).toHaveBeenCalled();
    });

    it("should throw Forbidden if not assigned", async () => {
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      await expect(service.submitReview({ reviewerId: "rev1", submissionId: "s1" })).rejects.toThrow(ForbiddenException);
    });
  });
});
