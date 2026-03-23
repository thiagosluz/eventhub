import { Test, TestingModule } from "@nestjs/testing";
import { SubmissionsService } from "./submissions.service";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { MailService } from "../mail/mail.service";
import { getQueueToken } from "@nestjs/bullmq";
import { ForbiddenException, NotFoundException } from "@nestjs/common";

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
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
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
    const params = {
      authorId: "user_1",
      eventId: "event_1",
      title: "Title",
      abstract: "Abstract",
      file: { buffer: Buffer.from("test"), mimetype: "application/pdf" },
    };

    it("should throw NotFoundException if event not found", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.createSubmission(params)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should create submission successfully", async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        id: "event_1",
        tenantId: "tenant_1",
      });
      mockMinioService.uploadObject.mockResolvedValue("file_url");
      mockPrismaService.submission.create.mockResolvedValue({
        id: "sub_1",
        title: "Title",
        author: { name: "Author", email: "author@test.com" },
        event: { name: "Event" },
      });

      const result = await service.createSubmission(params);

      expect(result).toBeDefined();
      expect(mockMinioService.uploadObject).toHaveBeenCalled();
      expect(mockPrismaService.submission.create).toHaveBeenCalled();
      expect(mockMailService.enqueue).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith("assign", expect.anything());
    });
  });

  describe("listSubmissionsForEvent", () => {
    it("should throw ForbiddenException if event does not belong to tenant", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(
        service.listSubmissionsForEvent("tenant_1", "event_1"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should list submissions successfully", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "event_1" });
      mockPrismaService.submission.findMany.mockResolvedValue([
        { id: "sub_1", title: "Sub 1", reviews: [] },
      ]);

      const result = await service.listSubmissionsForEvent(
        "tenant_1",
        "event_1",
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Sub 1");
    });
  });

  describe("submitReview", () => {
    it("should throw ForbiddenException if reviewer not assigned", async () => {
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      await expect(
        service.submitReview({ reviewerId: "rev_1", submissionId: "sub_1" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should update review successfully", async () => {
      mockPrismaService.review.findFirst.mockResolvedValue({ id: "rev_rec_1" });
      mockPrismaService.review.update.mockResolvedValue({
        id: "rev_rec_1",
        score: 5,
      });

      const result = await service.submitReview({
        reviewerId: "rev_1",
        submissionId: "sub_1",
        score: 5,
        recommendation: "ACCEPT",
      });

      expect(result.score).toBe(5);
      expect(mockPrismaService.review.update).toHaveBeenCalled();
    });
  });
});
