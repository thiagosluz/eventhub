import { Test, TestingModule } from "@nestjs/testing";
import { ActivitiesProcessor } from "./activities.processor";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollmentStatus } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("ActivitiesProcessor", () => {
  let processor: ActivitiesProcessor;

  const mockPrismaService = {
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
    it("cancela apenas enrollments expirados com uma única query consolidada", async () => {
      const now = Date.now();
      const staleDate = new Date(now - 3 * DAY_MS);
      const freshDate = new Date(now - 0.1 * DAY_MS);

      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([
        {
          id: "expired-1",
          createdAt: staleDate,
          activity: { id: "a1", title: "Palestra", confirmationDays: 1 },
        },
        {
          id: "expired-2",
          createdAt: staleDate,
          activity: { id: "a1", title: "Palestra", confirmationDays: 1 },
        },
        {
          id: "fresh-1",
          createdAt: freshDate,
          activity: { id: "a2", title: "Workshop", confirmationDays: 2 },
        },
      ]);

      await (processor as any).cleanupExpiredEnrollments();

      expect(
        mockPrismaService.activityEnrollment.findMany,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockPrismaService.activityEnrollment.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EnrollmentStatus.PENDING,
            activity: expect.objectContaining({
              requiresConfirmation: true,
              confirmationDays: { not: null },
            }),
          }),
        }),
      );

      expect(
        mockPrismaService.activityEnrollment.updateMany,
      ).toHaveBeenCalledWith({
        where: { id: { in: ["expired-1", "expired-2"] } },
        data: { status: EnrollmentStatus.CANCELLED },
      });
    });

    it("não chama updateMany quando não há enrollments expirados", async () => {
      const now = Date.now();
      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([
        {
          id: "fresh-1",
          createdAt: new Date(now - 0.1 * DAY_MS),
          activity: { id: "a1", title: "Palestra", confirmationDays: 1 },
        },
      ]);

      await (processor as any).cleanupExpiredEnrollments();

      expect(
        mockPrismaService.activityEnrollment.updateMany,
      ).not.toHaveBeenCalled();
    });

    it("não chama updateMany quando o findMany retorna vazio", async () => {
      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([]);
      await (processor as any).cleanupExpiredEnrollments();
      expect(
        mockPrismaService.activityEnrollment.updateMany,
      ).not.toHaveBeenCalled();
    });
  });
});
