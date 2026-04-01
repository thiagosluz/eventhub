import { Test, TestingModule } from "@nestjs/testing";
import { BadgesController } from "./badges.controller";
import { BadgesService } from "./badges.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

describe("BadgesController", () => {
  let controller: BadgesController;
  let service: BadgesService;

  const mockBadgesService = {
    getMyBadges: jest.fn(),
    getAvailableBadges: jest.fn(),
    createBadge: jest.fn(),
    getBadgesByEvent: jest.fn(),
    updateBadge: jest.fn(),
    claimBadge: jest.fn(),
    awardBadgeByScan: jest.fn(),
    getBadgeClaimCodes: jest.fn(),
    deleteBadge: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: "user_id",
      tenantId: "tenant_id",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BadgesController],
      providers: [
        {
          provide: BadgesService,
          useValue: mockBadgesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BadgesController>(BadgesController);
    service = module.get<BadgesService>(BadgesService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getMyBadges", () => {
    it("should call getMyBadges", async () => {
      await controller.getMyBadges(mockRequest);
      expect(service.getMyBadges).toHaveBeenCalledWith("user_id");
    });
  });

  describe("Management", () => {
    it("should create badge", async () => {
      await controller.create(mockRequest, "e1", { name: "B1" });
      expect(service.createBadge).toHaveBeenCalledWith("tenant_id", "e1", { name: "B1" });
    });

    it("should list all badges by event", async () => {
      await controller.findAll(mockRequest, "e1");
      expect(service.getBadgesByEvent).toHaveBeenCalledWith("tenant_id", "e1");
    });

    it("should update badge", async () => {
      await controller.update(mockRequest, "b1", { name: "B2" });
      expect(service.updateBadge).toHaveBeenCalledWith("tenant_id", "b1", { name: "B2" });
    });

    it("should delete badge", async () => {
      await controller.remove(mockRequest, "b1");
      expect(service.deleteBadge).toHaveBeenCalledWith("tenant_id", "b1");
    });
  });

  describe("Claiming", () => {
    it("should claim badge", async () => {
      await controller.claim(mockRequest, "b1", "code123");
      expect(service.claimBadge).toHaveBeenCalledWith("user_id", "b1", "code123");
    });

    it("should award by scan", async () => {
      await controller.awardByScan(mockRequest, "b1", "ticketToken");
      expect(service.awardBadgeByScan).toHaveBeenCalledWith("tenant_id", "b1", "ticketToken");
    });

    it("should get claim codes", async () => {
      await controller.getClaimCodes(mockRequest, "b1");
      expect(service.getBadgeClaimCodes).toHaveBeenCalledWith("tenant_id", "b1");
    });
  });
});
