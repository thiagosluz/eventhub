import { Test, TestingModule } from "@nestjs/testing";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

describe("TenantsController", () => {
  let controller: TenantsController;

  const mockTenantsService = {
    getPublicTenant: jest.fn(),
    getTenant: jest.fn(),
    updateTenant: jest.fn(),
    uploadLogo: jest.fn(),
    uploadCover: jest.fn(),
  };

  const mockRequest = {
    user: {
      tenantId: "t1",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [{ provide: TenantsService, useValue: mockTenantsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TenantsController>(TenantsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should get public tenant", async () => {
    await controller.getPublicTenant();
    expect(mockTenantsService.getPublicTenant).toHaveBeenCalled();
  });

  it("should get me", async () => {
    await controller.getMe(mockRequest);
    expect(mockTenantsService.getTenant).toHaveBeenCalledWith("t1");
  });

  it("should update me", async () => {
    const dto = { name: "New" };
    await controller.updateMe(mockRequest, dto as any);
    expect(mockTenantsService.updateTenant).toHaveBeenCalledWith("t1", dto);
  });

  it("should upload logo", async () => {
    const file = { buffer: Buffer.from(""), mimetype: "image/png" };
    await controller.uploadLogo(mockRequest, file as any);
    expect(mockTenantsService.uploadLogo).toHaveBeenCalledWith("t1", file);
  });

  it("should upload cover", async () => {
    const file = { buffer: Buffer.from(""), mimetype: "image/png" };
    await controller.uploadCover(mockRequest, file as any);
    expect(mockTenantsService.uploadCover).toHaveBeenCalledWith("t1", file);
  });
});
