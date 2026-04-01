import { Test, TestingModule } from "@nestjs/testing";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";
import { UpdateTenantDto } from "./dto/update-tenant.dto";

describe("TenantsController", () => {
  let controller: TenantsController;
  let service: TenantsService;

  const mockTenantsService = {
    getPublicTenant: jest.fn(),
    getTenant: jest.fn(),
    updateTenant: jest.fn(),
  };

  const mockRequest = {
    user: {
      tenantId: "tenant_id",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
    service = module.get<TenantsService>(TenantsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getPublicTenant", () => {
    it("should call service.getPublicTenant", async () => {
      await controller.getPublicTenant();
      expect(service.getPublicTenant).toHaveBeenCalled();
    });
  });

  describe("getMe", () => {
    it("should call service.getTenant", async () => {
      await controller.getMe(mockRequest);
      expect(service.getTenant).toHaveBeenCalledWith("tenant_id");
    });
  });

  describe("updateMe", () => {
    it("should call service.updateTenant", async () => {
      const dto: UpdateTenantDto = { name: "New Name" };
      await controller.updateMe(mockRequest, dto);
      expect(service.updateTenant).toHaveBeenCalledWith("tenant_id", dto);
    });
  });
});
