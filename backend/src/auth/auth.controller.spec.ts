import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    registerOrganizer: jest.fn(),
    registerParticipant: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changeForcedPassword: jest.fn(),
  };

  const mockRequest = {
    user: { sub: "user_id" },
    headers: { "user-agent": "jest", "x-forwarded-for": "9.9.9.9" },
    ip: "127.0.0.1",
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("registerOrganizer", () => {
    it("should call authService.registerOrganizer with request metadata", async () => {
      const dto = {
        tenantName: "T",
        tenantSlug: "s",
        name: "N",
        email: "e",
        password: "p",
      };
      await controller.registerOrganizer(dto, mockRequest);
      expect(service.registerOrganizer).toHaveBeenCalledWith(
        dto,
        expect.objectContaining({ userAgent: "jest", ip: "9.9.9.9" }),
      );
    });
  });

  describe("registerParticipant", () => {
    it("should call authService.registerParticipant", async () => {
      const dto = { name: "N", email: "e", password: "p" };
      await controller.registerParticipant(dto, mockRequest);
      expect(service.registerParticipant).toHaveBeenCalledWith(
        dto,
        expect.objectContaining({ userAgent: "jest" }),
      );
    });
  });

  describe("login", () => {
    it("should call authService.login", async () => {
      const dto = { email: "e", password: "p" };
      await controller.login(dto, mockRequest);
      expect(service.login).toHaveBeenCalledWith(
        dto,
        expect.objectContaining({ ip: "9.9.9.9" }),
      );
    });
  });

  describe("refresh", () => {
    it("should call authService.refresh", async () => {
      await controller.refresh({ refresh_token: "rt" }, mockRequest);
      expect(service.refresh).toHaveBeenCalledWith(
        "rt",
        expect.objectContaining({ userAgent: "jest" }),
      );
    });
  });

  describe("logout", () => {
    it("should call authService.logout passing token", async () => {
      await controller.logout({ refresh_token: "rt" }, mockRequest);
      expect(service.logout).toHaveBeenCalledWith("user_id", "rt");
    });
  });

  describe("forgotPassword", () => {
    it("should call authService.forgotPassword", async () => {
      await controller.forgotPassword({ email: "e" });
      expect(service.forgotPassword).toHaveBeenCalledWith("e");
    });
  });

  describe("resetPassword", () => {
    it("should call authService.resetPassword", async () => {
      await controller.resetPassword({ token: "t", newPassword: "n" });
      expect(service.resetPassword).toHaveBeenCalledWith("t", "n");
    });
  });

  describe("changeForcedPassword", () => {
    it("should call authService.changeForcedPassword", async () => {
      await controller.changeForcedPassword({ newPassword: "n" }, mockRequest);
      expect(service.changeForcedPassword).toHaveBeenCalledWith("user_id", "n");
    });
  });
});
