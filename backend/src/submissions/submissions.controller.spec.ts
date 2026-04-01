import { Test, TestingModule } from "@nestjs/testing";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { SubmitReviewDto } from "./dto/submit-review.dto";
import { AddReviewerDto } from "./dto/add-reviewer.dto";
import { AssignReviewDto } from "./dto/assign-review.dto";

describe("SubmissionsController", () => {
  let controller: SubmissionsController;
  let service: SubmissionsService;

  const mockSubmissionsService = {
    createSubmission: jest.fn(),
    listSubmissionsForEvent: jest.fn(),
    listAssignedToReviewer: jest.fn(),
    listMySubmissions: jest.fn(),
    submitReview: jest.fn(),
    listEventReviewers: jest.fn(),
    addReviewerToEvent: jest.fn(),
    removeReviewerFromEvent: jest.fn(),
    manualAssignReview: jest.fn(),
    deleteReview: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: "user_id",
      tenantId: "tenant_id",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: [
        {
          provide: SubmissionsService,
          useValue: mockSubmissionsService,
        },
      ],
    }).compile();

    controller = module.get<SubmissionsController>(SubmissionsController);
    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createSubmission", () => {
    it("should call service.createSubmission", async () => {
      const file = { buffer: Buffer.from(""), mimetype: "application/pdf" };
      const dto: CreateSubmissionDto = {
        eventId: "event1",
        title: "Title",
        abstract: "Abs",
      };
      await controller.createSubmission(file, dto, mockRequest);
      expect(service.createSubmission).toHaveBeenCalledWith({
        authorId: "user_id",
        eventId: "event1",
        title: "Title",
        abstract: "Abs",
        file: { buffer: file.buffer, mimetype: file.mimetype },
      });
    });

    it("should throw error if file missing", async () => {
      await expect(
        controller.createSubmission(null, {} as any, mockRequest),
      ).rejects.toThrow("Arquivo de submissão é obrigatório.");
    });
  });

  describe("listSubmissionsForEvent", () => {
    it("should call service.listSubmissionsForEvent", async () => {
      await controller.listSubmissionsForEvent("event1", mockRequest);
      expect(service.listSubmissionsForEvent).toHaveBeenCalledWith(
        "tenant_id",
        "event1",
      );
    });
  });

  describe("listAssignedToMe", () => {
    it("should call service.listAssignedToReviewer", async () => {
      await controller.listAssignedToMe(mockRequest);
      expect(service.listAssignedToReviewer).toHaveBeenCalledWith("user_id");
    });
  });

  describe("listMySubmissions", () => {
    it("should call service.listMySubmissions", async () => {
      await controller.listMySubmissions(mockRequest);
      expect(service.listMySubmissions).toHaveBeenCalledWith("user_id");
    });
  });

  describe("submitReview", () => {
    it("should call service.submitReview", async () => {
      const dto: SubmitReviewDto = {
        submissionId: "s1",
        score: 10,
        recommendation: "ACCEPT",
        comments: "Good",
      };
      await controller.submitReview(dto, mockRequest);
      expect(service.submitReview).toHaveBeenCalledWith({
        reviewerId: "user_id",
        submissionId: "s1",
        score: 10,
        recommendation: "ACCEPT",
        comments: "Good",
      });
    });
  });

  describe("Reviewer Management", () => {
    it("should list event reviewers", async () => {
      await controller.listEventReviewers("event1");
      expect(service.listEventReviewers).toHaveBeenCalledWith("event1");
    });

    it("should add reviewer", async () => {
      const dto: AddReviewerDto = { userId: "user2" };
      await controller.addReviewerToEvent("event1", dto);
      expect(service.addReviewerToEvent).toHaveBeenCalledWith("event1", "user2");
    });

    it("should remove reviewer", async () => {
      await controller.removeReviewerFromEvent("event1", "user2");
      expect(service.removeReviewerFromEvent).toHaveBeenCalledWith(
        "event1",
        "user2",
      );
    });
  });

  describe("Manual Assignments", () => {
    it("should manual assign review", async () => {
      const dto: AssignReviewDto = { submissionId: "s1", reviewerId: "r1" };
      await controller.manualAssignReview(dto);
      expect(service.manualAssignReview).toHaveBeenCalledWith("s1", "r1");
    });

    it("should delete review", async () => {
      await controller.deleteReview("rev1");
      expect(service.deleteReview).toHaveBeenCalledWith("rev1");
    });
  });
});
