import { Test, TestingModule } from "@nestjs/testing";
import { ActivitiesController } from "./activities.controller";
import { ActivitiesService } from "./activities.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";
import { MonitorGuard } from "../auth/monitor.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

describe("ActivitiesController", () => {
  let controller: ActivitiesController;
  let service: ActivitiesService;

  const mockActivitiesService = {
    createActivity: jest.fn(),
    listActivitiesForEvent: jest.fn(),
    getActivitiesForParticipant: jest.fn(),
    updateActivity: jest.fn(),
    enrollInActivity: jest.fn(),
    deleteActivity: jest.fn(),
    unrollFromActivity: jest.fn(),
    createType: jest.fn(),
    findAllTypes: jest.fn(),
    removeType: jest.fn(),
    listEnrollments: jest.fn(),
    confirmEnrollment: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: "user_id",
      tenantId: "tenant_id",
      role: "ORGANIZER",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(MonitorGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    service = module.get<ActivitiesService>(ActivitiesService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createActivity", () => {
    it("should call activities.createActivity", async () => {
      const dto: CreateActivityDto = {
        title: "Test",
        typeId: "type1",
        startAt: "2024-01-01T10:00:00Z",
        endAt: "2024-01-01T11:00:00Z",
      };
      await controller.createActivity("event1", dto, mockRequest);
      expect(service.createActivity).toHaveBeenCalledWith({
        tenantId: "tenant_id",
        eventId: "event1",
        data: dto,
      });
    });

    it("should throw error if tenantId missing", async () => {
      await expect(
        controller.createActivity("event1", {} as any, { user: {} } as any),
      ).rejects.toThrow("Missing tenantId on token payload.");
    });
  });

  describe("listActivitiesForEvent", () => {
    it("should call activities.listActivitiesForEvent", async () => {
      await controller.listActivitiesForEvent("event1", mockRequest);
      expect(service.listActivitiesForEvent).toHaveBeenCalledWith(
        "tenant_id",
        "event1",
      );
    });
  });

  describe("getMyEnrollments", () => {
    it("should call activities.getActivitiesForParticipant", async () => {
      await controller.getMyEnrollments("event1", mockRequest);
      expect(service.getActivitiesForParticipant).toHaveBeenCalledWith({
        userId: "user_id",
        eventId: "event1",
      });
    });

    it("should throw error if userId missing", async () => {
      await expect(
        controller.getMyEnrollments("event1", { user: {} } as any),
      ).rejects.toThrow("Missing userId on token payload.");
    });
  });

  describe("updateActivity", () => {
    it("should call activities.updateActivity", async () => {
      const dto: UpdateActivityDto = { title: "Updated" };
      await controller.updateActivity("activity1", dto, mockRequest);
      expect(service.updateActivity).toHaveBeenCalledWith({
        tenantId: "tenant_id",
        activityId: "activity1",
        data: dto,
      });
    });
  });

  describe("enrollInActivity", () => {
    it("should call activities.enrollInActivity", async () => {
      await controller.enrollInActivity("activity1", mockRequest);
      expect(service.enrollInActivity).toHaveBeenCalledWith({
        userId: "user_id",
        activityId: "activity1",
      });
    });
  });

  describe("deleteActivity", () => {
    it("should call activities.deleteActivity", async () => {
      await controller.deleteActivity("activity1", mockRequest);
      expect(service.deleteActivity).toHaveBeenCalledWith(
        "tenant_id",
        "activity1",
      );
    });
  });

  describe("unrollFromActivity", () => {
    it("should call activities.unrollFromActivity", async () => {
      await controller.unrollFromActivity("activity1", mockRequest);
      expect(service.unrollFromActivity).toHaveBeenCalledWith({
        userId: "user_id",
        activityId: "activity1",
      });
    });
  });

  describe("Activity Types", () => {
    it("should create type", async () => {
      await controller.createType(mockRequest, "Workshop");
      expect(service.createType).toHaveBeenCalledWith("tenant_id", "Workshop");
    });

    it("should find all types", async () => {
      await controller.findAllTypes(mockRequest);
      expect(service.findAllTypes).toHaveBeenCalledWith("tenant_id");
    });

    it("should remove type", async () => {
      await controller.removeType(mockRequest, "type1");
      expect(service.removeType).toHaveBeenCalledWith("tenant_id", "type1");
    });
  });

  describe("Enrollments", () => {
    it("should list enrollments", async () => {
      await controller.listEnrollments("activity1", mockRequest);
      expect(service.listEnrollments).toHaveBeenCalledWith(
        "tenant_id",
        "activity1",
      );
    });

    it("should confirm enrollment", async () => {
      await controller.confirmEnrollment("act1", "enr1", mockRequest);
      expect(service.confirmEnrollment).toHaveBeenCalledWith(
        "tenant_id",
        "act1",
        "enr1",
      );
    });
  });
});
