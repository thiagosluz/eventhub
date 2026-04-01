import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UpdateProfileDto, UpdatePasswordDto } from "./dto/update-user.dto";

describe("UsersController", () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findMe: jest.fn(),
    updateProfile: jest.fn(),
    updatePassword: jest.fn(),
    uploadAvatar: jest.fn(),
    findAll: jest.fn(),
    findMyMonitoredEvents: jest.fn(),
    findByUsername: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: "user_id",
      tenantId: "tenant_id",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getMe", () => {
    it("should call service.findMe", async () => {
      await controller.getMe(mockRequest);
      expect(service.findMe).toHaveBeenCalledWith("user_id");
    });
  });

  describe("updateProfile", () => {
    it("should call service.updateProfile", async () => {
      const dto: UpdateProfileDto = { name: "New Name" };
      await controller.updateProfile(dto, mockRequest);
      expect(service.updateProfile).toHaveBeenCalledWith("user_id", dto);
    });
  });

  describe("updatePassword", () => {
    it("should call service.updatePassword", async () => {
      const dto: UpdatePasswordDto = {
        currentPassword: "o",
        newPassword: "n",
      };
      await controller.updatePassword(dto, mockRequest);
      expect(service.updatePassword).toHaveBeenCalledWith("user_id", dto);
    });
  });

  describe("uploadAvatar", () => {
    it("should call service.uploadAvatar", async () => {
      const file = { buffer: Buffer.from(""), mimetype: "image/png" } as any;
      await controller.uploadAvatar(file, mockRequest);
      expect(service.uploadAvatar).toHaveBeenCalledWith("user_id", file);
    });
  });

  describe("findAll", () => {
    it("should call service.findAll", async () => {
      await controller.findAll(mockRequest);
      expect(service.findAll).toHaveBeenCalledWith("tenant_id");
    });
  });

  describe("getMyMonitoredEvents", () => {
    it("should call service.findMyMonitoredEvents", async () => {
      await controller.getMyMonitoredEvents(mockRequest);
      expect(service.findMyMonitoredEvents).toHaveBeenCalledWith("user_id");
    });
  });
});
