import { Test, TestingModule } from "@nestjs/testing";
import { ActivitiesProcessor } from "./activities.processor";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollmentStatus } from "../generated/prisma";

describe("ActivitiesProcessor", () => {
  let processor: ActivitiesProcessor;

  const mockPrismaService = {
    activity: {
      findMany: jest.fn(),
    },
    activityEnrollment: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    processor = module.get<ActivitiesProcessor>(ActivitiesProcessor);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(processor).toBeDefined();
  });

  describe("cleanupExpiredEnrollments", () => {
    it("should cancel expired pending enrollments", async () => {
      const activity = {
        id: "a1",
        title: "Act",
        requiresConfirmation: true,
        confirmationDays: 1,
      };
      mockPrismaService.activity.findMany.mockResolvedValue([activity]);

      const expiredEnrollment = { id: "e1", status: EnrollmentStatus.PENDING };
      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([
        expiredEnrollment,
      ]);

      await (processor as any).cleanupExpiredEnrollments();

      expect(
        mockPrismaService.activityEnrollment.updateMany,
      ).toHaveBeenCalledWith({
        where: { id: { in: ["e1"] } },
        data: { status: EnrollmentStatus.CANCELLED },
      });
    });

    it("should do nothing if no expired enrollments found", async () => {
      mockPrismaService.activity.findMany.mockResolvedValue([]);
      await (processor as any).cleanupExpiredEnrollments();
      expect(
        mockPrismaService.activityEnrollment.updateMany,
      ).not.toHaveBeenCalled();
    });
  });
});
