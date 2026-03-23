import { Test, TestingModule } from "@nestjs/testing";
import { ActivitiesService } from "./activities.service";
import { PrismaService } from "../prisma/prisma.service";
import { getQueueToken } from "@nestjs/bullmq";
import { ForbiddenException } from "@nestjs/common";

describe("ActivitiesService", () => {
  let service: ActivitiesService;

  const mockPrismaService = {
    event: {
      findFirst: jest.fn(),
    },
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    activitySpeaker: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    activityEnrollment: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    registration: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    attendance: {
      deleteMany: jest.fn(),
    },
    activityType: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: getQueueToken("activities"), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createActivity", () => {
    it("should throw ForbiddenException if event not in tenant", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(
        service.createActivity({
          tenantId: "t1",
          eventId: "e1",
          data: { title: "Act", startAt: "2023-01-01", endAt: "2023-01-01" },
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should create activity and auto-enroll if not required", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.activity.create.mockResolvedValue({
        id: "a1",
        requiresEnrollment: false,
      });
      mockPrismaService.registration.findMany.mockResolvedValue([
        { id: "reg1" },
      ]);
      mockPrismaService.activity.findFirst.mockResolvedValue({
        id: "a1",
        speakers: [],
        enrollments: [],
      }); // Result of getActivityForTenant

      await service.createActivity({
        tenantId: "t1",
        eventId: "e1",
        data: {
          title: "Act",
          startAt: "2023-01-01",
          endAt: "2023-01-01",
          requiresEnrollment: false,
        },
      });

      expect(
        mockPrismaService.activityEnrollment.createMany,
      ).toHaveBeenCalled();
    });
  });

  describe("enrollInActivity", () => {
    it("should throw ForbiddenException on time conflict", async () => {
      const activity = {
        id: "a1",
        eventId: "e1",
        startAt: new Date("2023-01-01T10:00:00Z"),
        endAt: new Date("2023-01-01T12:00:00Z"),
        capacity: 10,
        enrollments: [],
      };
      mockPrismaService.activity.findUnique.mockResolvedValue(activity);
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg1",
      });

      // Conflict activity: 11:00 to 13:00 (overlaps with 10:00 to 12:00)
      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([
        {
          activity: {
            startAt: new Date("2023-01-01T11:00:00Z"),
            endAt: new Date("2023-01-01T13:00:00Z"),
          },
        },
      ]);

      await expect(
        service.enrollInActivity({ userId: "u1", activityId: "a1" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if capacity reached", async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue({
        id: "a1",
        capacity: 1,
        enrollments: [{}], // Already full
      });
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg1",
      });
      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([]);

      await expect(
        service.enrollInActivity({ userId: "u1", activityId: "a1" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should enroll successfully if no conflict and space available", async () => {
      mockPrismaService.activity.findUnique.mockResolvedValue({
        id: "a1",
        capacity: 10,
        enrollments: [],
        requiresConfirmation: false,
      });
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg1",
      });
      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([]);
      mockPrismaService.activityEnrollment.findFirst.mockResolvedValue(null);

      await service.enrollInActivity({ userId: "u1", activityId: "a1" });
      expect(mockPrismaService.activityEnrollment.create).toHaveBeenCalled();
    });
  });

  describe("listActivitiesForEvent", () => {
    it("should list activities with remaining spots calculation", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.activity.findMany.mockResolvedValue([
        {
          id: "a1",
          title: "Act",
          capacity: 10,
          enrollments: [{}, {}],
          speakers: [],
        },
      ]);

      const result = await service.listActivitiesForEvent("t1", "e1");
      expect(result[0].remainingSpots).toBe(8);
    });
  });

  describe("updateActivity", () => {
    it("should update activity and sync speakers", async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue({
        id: "a1",
        speakers: [],
        enrollments: [],
      });
      mockPrismaService.activity.findUnique.mockResolvedValue({
        id: "a1",
        eventId: "e1",
      });
      mockPrismaService.activity.update.mockResolvedValue({ id: "a1" });

      await service.updateActivity({
        tenantId: "t1",
        activityId: "a1",
        data: { title: "New Title", speakers: [{ speakerId: "s1" }] },
      });

      expect(mockPrismaService.activitySpeaker.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.activitySpeaker.createMany).toHaveBeenCalled();
    });
  });

  describe("deleteActivity", () => {
    it("should delete activity and its associations", async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue({
        id: "a1",
        speakers: [],
        enrollments: [],
      });

      await service.deleteActivity("t1", "a1");

      expect(mockPrismaService.activitySpeaker.deleteMany).toHaveBeenCalled();
      expect(
        mockPrismaService.activityEnrollment.deleteMany,
      ).toHaveBeenCalled();
      expect(mockPrismaService.activity.delete).toHaveBeenCalled();
    });
  });

  describe("Activity Types", () => {
    it("should manage activity types", async () => {
      await service.createType("t1", "Workshop");
      expect(mockPrismaService.activityType.create).toHaveBeenCalled();

      await service.findAllTypes("t1");
      expect(mockPrismaService.activityType.findMany).toHaveBeenCalled();

      mockPrismaService.activityType.findFirst.mockResolvedValue({
        id: "type1",
      });
      await service.removeType("t1", "type1");
      expect(mockPrismaService.activityType.delete).toHaveBeenCalled();
    });
  });

  describe("Enrollment Management", () => {
    it("should list and confirm enrollments", async () => {
      mockPrismaService.activity.findFirst.mockResolvedValue({
        id: "a1",
        speakers: [],
        enrollments: [],
      });
      await service.listEnrollments("t1", "a1");
      expect(mockPrismaService.activityEnrollment.findMany).toHaveBeenCalled();

      mockPrismaService.activityEnrollment.findUnique.mockResolvedValue({
        id: "en1",
        status: "PENDING",
      });
      await service.confirmEnrollment("t1", "a1", "en1");
      expect(mockPrismaService.activityEnrollment.update).toHaveBeenCalled();
    });
  });
});
