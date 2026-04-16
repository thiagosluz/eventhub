import { Test, TestingModule } from "@nestjs/testing";
import { PublicTenantsController } from "./public-tenants.controller";
import { TenantsService } from "./tenants.service";

describe("PublicTenantsController", () => {
  let controller: PublicTenantsController;

  const mockTenantsService = {
    findAllPublic: jest.fn(),
    findOnePublic: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicTenantsController],
      providers: [{ provide: TenantsService, useValue: mockTenantsService }],
    }).compile();

    controller = module.get<PublicTenantsController>(PublicTenantsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should find all public tenants", async () => {
    await controller.findAll();
    expect(mockTenantsService.findAllPublic).toHaveBeenCalled();
  });

  it("should find one public tenant by slug", async () => {
    await controller.findOne("slug-1");
    expect(mockTenantsService.findOnePublic).toHaveBeenCalledWith("slug-1");
  });
});
