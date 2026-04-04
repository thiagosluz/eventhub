import { Test, TestingModule } from "@nestjs/testing";
import { StaffManagementController } from "./staff-management.controller";
import { StaffManagementService } from "./staff-management.service";
import { CreateOrganizerDto } from "./dto/create-organizer.dto";
import { AssignMonitorDto } from "./dto/assign-monitor.dto";

describe("StaffManagementController", () => {
  let controller: StaffManagementController;
  let service: StaffManagementService;

  const mockStaffService = {
    createOrganizer: jest.fn(),
    listOrganizers: jest.fn(),
    assignMonitor: jest.fn(),
    removeMonitor: jest.fn(),
    listMonitors: jest.fn(),
    listEventParticipants: jest.fn(),
  };

  const mockRequest = {
    user: {
      tenantId: "tenant_id",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffManagementController],
      providers: [
        {
          provide: StaffManagementService,
          useValue: mockStaffService,
        },
      ],
    }).compile();

    controller = module.get<StaffManagementController>(
      StaffManagementController,
    );
    service = module.get<StaffManagementService>(StaffManagementService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createOrganizer", () => {
    it("should call service.createOrganizer", async () => {
      const dto: CreateOrganizerDto = {
        email: "test@test.com",
        name: "Org",
        temporaryPassword: "pw123",
      };
      await controller.createOrganizer(mockRequest, dto);
      expect(service.createOrganizer).toHaveBeenCalledWith("tenant_id", dto);
    });
  });

  describe("listOrganizers", () => {
    it("should call service.listOrganizers", async () => {
      await controller.listOrganizers(mockRequest);
      expect(service.listOrganizers).toHaveBeenCalledWith("tenant_id");
    });
  });

  describe("assignMonitor", () => {
    it("should call service.assignMonitor", async () => {
      const dto: AssignMonitorDto = { userId: "user1" };
      await controller.assignMonitor("event1", dto);
      expect(service.assignMonitor).toHaveBeenCalledWith("event1", "user1");
    });
  });

  describe("removeMonitor", () => {
    it("should call service.removeMonitor", async () => {
      await controller.removeMonitor("event1", "user1");
      expect(service.removeMonitor).toHaveBeenCalledWith("event1", "user1");
    });
  });

  describe("listMonitors", () => {
    it("should call service.listMonitors", async () => {
      await controller.listMonitors("event1");
      expect(service.listMonitors).toHaveBeenCalledWith("event1");
    });
  });

  describe("listPotentialMonitors", () => {
    it("should map registrations to users", async () => {
      mockStaffService.listEventParticipants.mockResolvedValue([
        { user: { id: "u1", name: "U1" } },
        { user: { id: "u2", name: "U2" } },
      ]);
      const result = await controller.listPotentialMonitors("event1");
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("U1");
    });
  });
});
