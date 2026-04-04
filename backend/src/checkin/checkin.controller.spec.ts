import { Test, TestingModule } from "@nestjs/testing";
import { CheckinController } from "./checkin.controller";
import { CheckinService } from "./checkin.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

describe("CheckinController", () => {
  let controller: CheckinController;
  let service: CheckinService;

  const mockCheckinService = {
    getQrCodePng: jest.fn(),
    checkin: jest.fn(),
    drawRaffle: jest.fn(),
    getEventRaffleHistory: jest.fn(),
    setRaffleDisplayVisibility: jest.fn(),
    deleteRaffleHistory: jest.fn(),
    markPrizeReceived: jest.fn(),
    undoCheckin: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: "user_id",
      tenantId: "tenant_id",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckinController],
      providers: [
        {
          provide: CheckinService,
          useValue: mockCheckinService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CheckinController>(CheckinController);
    service = module.get<CheckinService>(CheckinService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getTicketQrCode", () => {
    it("should send PNG response", async () => {
      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;
      mockCheckinService.getQrCodePng.mockResolvedValue(Buffer.from("png"));

      await controller.getTicketQrCode("ticket1", mockRequest, res);

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/png");
      expect(res.send).toHaveBeenCalledWith(Buffer.from("png"));
    });
  });

  describe("checkin", () => {
    it("should call checkin service", async () => {
      const body = { qrCodeToken: "token", activityId: "act1" };
      await controller.checkin(mockRequest, body);
      expect(service.checkin).toHaveBeenCalledWith({
        qrCodeToken: "token",
        activityId: "act1",
        performedByUserId: "user_id",
      });
    });
  });

  describe("Raffles", () => {
    it("should draw raffle", async () => {
      const body = { eventId: "e1", count: 2 };
      await controller.drawRaffle(body as any, mockRequest);
      expect(service.drawRaffle).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant_id",
          eventId: "e1",
          count: 2,
        }),
      );
    });

    it("should get latest raffle", async () => {
      mockCheckinService.getEventRaffleHistory.mockResolvedValue([
        { id: "r1" },
      ]);
      const result = await controller.getLatestRaffle("e1", mockRequest);
      expect(result).toEqual({ id: "r1" });
    });

    it("should return null if no latest raffle", async () => {
      mockCheckinService.getEventRaffleHistory.mockResolvedValue([]);
      const result = await controller.getLatestRaffle("e1", mockRequest);
      expect(result).toBeNull();
    });

    it("should set visibility", async () => {
      await controller.setRaffleDisplayVisibility(
        "r1",
        { hide: true },
        mockRequest,
      );
      expect(service.setRaffleDisplayVisibility).toHaveBeenCalledWith(
        "tenant_id",
        "r1",
        true,
      );
    });

    it("should get history", async () => {
      await controller.getRaffleHistory("e1", mockRequest);
      expect(service.getEventRaffleHistory).toHaveBeenCalledWith(
        "tenant_id",
        "e1",
      );
    });

    it("should delete history", async () => {
      await controller.deleteRaffleHistory("r1", mockRequest);
      expect(service.deleteRaffleHistory).toHaveBeenCalledWith(
        "tenant_id",
        "r1",
      );
    });

    it("should mark received", async () => {
      await controller.markPrizeReceived("r1", { received: true }, mockRequest);
      expect(service.markPrizeReceived).toHaveBeenCalledWith(
        "tenant_id",
        "r1",
        true,
      );
    });
  });

  describe("undoCheckin", () => {
    it("should call undoCheckin service", async () => {
      await controller.undoCheckin("checkin1", mockRequest);
      expect(service.undoCheckin).toHaveBeenCalledWith("checkin1", "user_id");
    });
  });
});
