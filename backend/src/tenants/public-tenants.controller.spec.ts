import { Test, TestingModule } from "@nestjs/testing";
import { PublicTenantsController } from "./public-tenants.controller";
import { TenantsService } from "./tenants.service";

describe("PublicTenantsController", () => {
  let controller: PublicTenantsController;
  let service: TenantsService;

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
    service = module.get<TenantsService>(TenantsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should list all public tenants", async () => {
    mockTenantsService.findAllPublic.mockResolvedValue([]);
    await controller.findAll();
    expect(service.findAllPublic).toHaveBeenCalled();
  });

  it("should get one public tenant by slug", async () => {
    mockTenantsService.findOnePublic.mockResolvedValue({ id: "1" });
    await controller.findOne("slug");
    expect(service.findOnePublic).toHaveBeenCalledWith("slug");
  });
});
