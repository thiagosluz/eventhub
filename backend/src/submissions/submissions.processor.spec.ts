import { Test, TestingModule } from "@nestjs/testing";
import { AssignReviewsProcessor } from "./submissions.processor";
import { PrismaService } from "../prisma/prisma.service";
import { Job } from "bullmq";

describe("AssignReviewsProcessor", () => {
  let processor: AssignReviewsProcessor;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignReviewsProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    processor = module.get<AssignReviewsProcessor>(AssignReviewsProcessor);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(processor).toBeDefined();
  });

  describe("process", () => {
    const job = {
      data: {
        submissionId: "sub_1",
        eventId: "event_1",
        tenantId: "tenant_1",
      },
    } as Job;

    it("should assign reviewers correctly", async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: "rev_1" },
        { id: "rev_2" },
      ]);
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.createMany.mockResolvedValue({ count: 2 });

      await processor.process(job);

      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
      expect(mockPrismaService.review.createMany).toHaveBeenCalledWith({
        data: [
          { submissionId: "sub_1", reviewerId: "rev_1" },
          { submissionId: "sub_1", reviewerId: "rev_2" },
        ],
      });
    });

    it("should not assign if no reviewers found", async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      await processor.process(job);
      expect(mockPrismaService.review.createMany).not.toHaveBeenCalled();
    });

    it("should not assign if reviews already exist", async () => {
      mockPrismaService.user.findMany.mockResolvedValue([{ id: "rev_1" }]);
      mockPrismaService.review.findMany.mockResolvedValue([
        { id: "existing_rev" },
      ]);
      await processor.process(job);
      expect(mockPrismaService.review.createMany).not.toHaveBeenCalled();
    });
  });
});
