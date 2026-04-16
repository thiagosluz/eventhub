import { Test, TestingModule } from "@nestjs/testing";
import { ReviewerManagementController } from "./reviewer-management.controller";
import { ReviewerManagementService } from "./reviewer-management.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

describe("ReviewerManagementController", () => {
  let controller: ReviewerManagementController;
  let service: ReviewerManagementService;

  const mockReviewerService = {
    inviteReviewer: jest.fn(),
    manualRegister: jest.fn(),
    getInvitation: jest.fn(),
    acceptInvitation: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: "user_id",
      tenantId: "tenant_id",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewerManagementController],
      providers: [
        {
          provide: ReviewerManagementService,
          useValue: mockReviewerService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReviewerManagementController>(
      ReviewerManagementController,
    );
    service = module.get<ReviewerManagementService>(ReviewerManagementService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should invite reviewer", async () => {
    const dto = { email: "r1@t.com" };
    await controller.inviteReviewer("e1", dto as any, mockRequest);
    expect(service.inviteReviewer).toHaveBeenCalledWith(
      "e1",
      "r1@t.com",
      "user_id",
    );
  });

  it("should throw if invitedById missing", async () => {
    await expect(
      controller.inviteReviewer("e1", {} as any, { user: {} } as any),
    ).rejects.toThrow("Missing user id");
  });

  it("should manual register reviewer", async () => {
    const dto = { email: "e", name: "n" };
    await controller.manualRegister("e1", dto as any);
    expect(service.manualRegister).toHaveBeenCalledWith("e1", dto);
  });

  it("should get invitation", async () => {
    await controller.getInvitation("tok1");
    expect(service.getInvitation).toHaveBeenCalledWith("tok1");
  });

  it("should accept invitation", async () => {
    const dto = { token: "tok1", password: "p1" };
    await controller.acceptInvitation(dto as any);
    expect(service.acceptInvitation).toHaveBeenCalledWith(dto);
  });
});
