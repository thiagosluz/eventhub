import { Test, TestingModule } from "@nestjs/testing";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

describe("DashboardController", () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getStats: jest.fn(),
  };

  const mockRequest = {
    user: {
      tenantId: "tenant_id",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getStats", () => {
    it("should call service.getStats", async () => {
      await controller.getStats(mockRequest);
      expect(service.getStats).toHaveBeenCalledWith("tenant_id");
    });

    it("should throw error if tenantId missing", async () => {
      await expect(controller.getStats({ user: {} } as any)).rejects.toThrow(
        "Tenant missing from request.",
      );
    });
  });
});
