import { Test, TestingModule } from "@nestjs/testing";
import { PublicActivitiesController } from "./public-activities.controller";
import { ActivitiesService } from "./activities.service";
import { PrismaService } from "src/prisma/prisma.service";

describe("PublicActivitiesController", () => {
  let controller: PublicActivitiesController;
  let service: ActivitiesService;

  const mockActivitiesService = {
    getPublicActivityInfo: jest.fn(),
    submitPublicFeedback: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PublicActivitiesController>(
      PublicActivitiesController,
    );
    service = module.get<ActivitiesService>(ActivitiesService);
    jest.clearAllMocks();
  });

  describe("getFeedbackInfo", () => {
    it("should call getPublicActivityInfo with correct activityId", async () => {
      const activityId = "activity-123";
      await controller.getFeedbackInfo(activityId);
      expect(service.getPublicActivityInfo).toHaveBeenCalledWith(activityId);
    });
  });

  describe("submitFeedback", () => {
    it("should call submitPublicFeedback with correct parameters", async () => {
      const activityId = "activity-123";
      const body = { rating: 5, comment: "Great activity!" };
      await controller.submitFeedback(activityId, body);
      expect(service.submitPublicFeedback).toHaveBeenCalledWith(
        activityId,
        body,
      );
    });
  });
});
