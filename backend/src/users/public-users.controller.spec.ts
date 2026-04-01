import { Test, TestingModule } from "@nestjs/testing";
import { PublicUsersController } from "./public-users.controller";
import { UsersService } from "./users.service";

describe("PublicUsersController", () => {
  let controller: PublicUsersController;
  let service: UsersService;

  const mockUsersService = {
    findByUsername: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicUsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<PublicUsersController>(PublicUsersController);
    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should call findByUsername", async () => {
    await controller.getByUsername("user1");
    expect(service.findByUsername).toHaveBeenCalledWith("user1");
  });
});
