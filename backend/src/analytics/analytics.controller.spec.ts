import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { GamificationService } from "../gamification/gamification.service";
import { BadgesService } from "../badges/badges.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { MonitorGuard } from "../auth/monitor.guard";

describe("AnalyticsController", () => {
  let controller: AnalyticsController;

  const mockAnalyticsService = {
    getEventAnalytics: jest.fn(),
    getEventParticipants: jest.fn(),
    getEventCheckins: jest.fn(),
  };

  const mockGamificationService = {
    getEventStats: jest.fn(),
    getEventRanking: jest.fn(),
    getEventAlerts: jest.fn(),
    resolveAlert: jest.fn(),
  };

  const mockBadgesService = {
    getAwardedHistory: jest.fn(),
    revokeBadge: jest.fn(),
  };

  const mockRequest = {
    user: {
      tenantId: "tenant_id",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: GamificationService,
          useValue: mockGamificationService,
        },
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
      .overrideGuard(MonitorGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("Event Analytics", () => {
    it("should call getEventAnalytics", async () => {
      await controller.getEventAnalytics("e1", mockRequest);
      expect(mockAnalyticsService.getEventAnalytics).toHaveBeenCalledWith(
        "tenant_id",
        "e1",
      );
    });

    it("should call getEventParticipants", async () => {
      await controller.getEventParticipants("e1", mockRequest);
      expect(mockAnalyticsService.getEventParticipants).toHaveBeenCalledWith(
        "tenant_id",
        "e1",
      );
    });

    it("should call getEventCheckins", async () => {
      await controller.getEventCheckins("e1", "act1", mockRequest);
      expect(mockAnalyticsService.getEventCheckins).toHaveBeenCalledWith(
        "tenant_id",
        "e1",
        "act1",
      );
    });
  });

  describe("Gamification", () => {
    it("should call getStats", async () => {
      await controller.getStats("e1");
      expect(mockGamificationService.getEventStats).toHaveBeenCalledWith("e1");
    });

    it("should call getRanking", async () => {
      await controller.getRanking("e1");
      expect(mockGamificationService.getEventRanking).toHaveBeenCalledWith(
        "e1",
      );
    });

    it("should call getAlerts", async () => {
      await controller.getAlerts("e1");
      expect(mockGamificationService.getEventAlerts).toHaveBeenCalledWith("e1");
    });

    it("should call resolveAlert", async () => {
      await controller.resolveAlert("a1");
      expect(mockGamificationService.resolveAlert).toHaveBeenCalledWith("a1");
    });
  });

  describe("Badges", () => {
    it("should call getBadgesHistory", async () => {
      await controller.getBadgesHistory("e1", mockRequest);
      expect(mockBadgesService.getAwardedHistory).toHaveBeenCalledWith(
        "tenant_id",
        "e1",
      );
    });

    it("should call revokeBadge", async () => {
      await controller.revokeBadge("ub1", mockRequest);
      expect(mockBadgesService.revokeBadge).toHaveBeenCalledWith(
        "tenant_id",
        "ub1",
      );
    });
  });
});
