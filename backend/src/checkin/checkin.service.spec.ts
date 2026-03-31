import { Test, TestingModule } from "@nestjs/testing";
import { CheckinService } from "./checkin.service";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { BadgesService } from "../badges/badges.service";
import { ForbiddenException, NotFoundException } from "@nestjs/common";

describe("CheckinService", () => {
  let service: CheckinService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: "u1", role: "ORGANIZER", tenantId: "t1" }),
    },
    eventMonitor: {
      findUnique: jest.fn(),
    },
    ticket: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    activity: {
      findUnique: jest.fn(),
    },
    activityEnrollment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    attendance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    event: {
      findFirst: jest.fn(),
    },
    raffleHistory: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockMailService = {
    enqueue: jest.fn(),
  };

  const mockBadgesService = {
    checkAndAwardBadge: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckinService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: mockMailService },
        { provide: BadgesService, useValue: mockBadgesService },
      ],
    }).compile();

    service = module.get<CheckinService>(CheckinService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getQrCodePng", () => {
    it("should throw NotFoundException if ticket not found", async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);
      await expect(service.getQrCodePng("t1", "u1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException if ticket belongs to another user", async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue({
        registration: { userId: "u2" },
      });
      await expect(service.getQrCodePng("t1", "u1")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should return QR Code buffer successfully", async () => {
      mockPrismaService.ticket.findFirst.mockResolvedValue({
        id: "t1",
        qrCodeToken: "token",
        registration: { userId: "u1" },
      });
      const result = await service.getQrCodePng("t1", "u1");
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe("checkin", () => {
    it("should throw NotFoundException if ticket is invalid", async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);
      await expect(service.checkin({ qrCodeToken: "invalid", performedByUserId: "u1" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should perform checkin successfully", async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        id: "t1",
        eventId: "e1",
        event: { tenantId: "t1" },
      });
      mockPrismaService.attendance.findFirst.mockResolvedValue(null);
      mockPrismaService.attendance.create.mockResolvedValue({
        id: "att1",
        ticket: {
          registration: {
            user: { id: "u1", name: "User", email: "u@t.com" },
            event: { id: "e1", name: "Event" },
          },
        },
      });

      const result = await service.checkin({ qrCodeToken: "token", performedByUserId: "u1" });
      expect(result.alreadyCheckedIn).toBe(false);
      expect(mockMailService.enqueue).toHaveBeenCalled();
      expect(mockBadgesService.checkAndAwardBadge).toHaveBeenCalled();
    });

    it("should return alreadyCheckedIn true if attendance exists", async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({ id: "t1", eventId: "e1", event: { tenantId: "t1" } });
      mockPrismaService.attendance.findFirst.mockResolvedValue({ id: "att1" });

      const result = await service.checkin({ qrCodeToken: "token", performedByUserId: "u1" });
      expect(result.alreadyCheckedIn).toBe(true);
      expect(mockPrismaService.attendance.create).not.toHaveBeenCalled();
    });

    it("should throw Forbidden if activity requires enrollment and user is not enrolled", async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({ id: "t1", eventId: "e1", event: { tenantId: "t1" } });
      mockPrismaService.activity.findUnique.mockResolvedValue({ id: "a1", eventId: "e1", requiresEnrollment: true });
      mockPrismaService.activityEnrollment.findFirst.mockResolvedValue(null);

      await expect(service.checkin({ qrCodeToken: "token", activityId: "a1", performedByUserId: "u1" })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw NotFound if activity belongs to another event", async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue({ id: "t1", eventId: "e1", event: { tenantId: "t1" } });
      mockPrismaService.activity.findUnique.mockResolvedValue({ id: "a1", eventId: "e2" });

      await expect(service.checkin({ qrCodeToken: "token", activityId: "a1", performedByUserId: "u1" })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("drawRaffle", () => {
    it("should throw ForbiddenException if event not in tenant", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(
        service.drawRaffle({ tenantId: "t1", eventId: "e1" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should draw a winner successfully", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.attendance.findMany.mockResolvedValue([
        {
          ticket: {
            registration: {
              id: "reg1",
              user: { name: "Winner", role: "PARTICIPANT" },
            },
          },
        },
      ]);
      mockPrismaService.raffleHistory.create.mockResolvedValue({ id: "h1" });

      const result = await service.drawRaffle({
        tenantId: "t1",
        eventId: "e1",
        count: 1,
      });
      expect(result.winners).toHaveLength(1);
      expect(result.winners[0].userName).toBe("Winner");
      expect(mockPrismaService.raffleHistory.create).toHaveBeenCalled();
    });

    it("should filter staff if excludeStaff is true", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.attendance.findMany.mockResolvedValue([
        { ticket: { registration: { id: "r1", user: { name: "Org", role: "ORGANIZER" } } } },
        { ticket: { registration: { id: "r2", user: { name: "Part", role: "PARTICIPANT" } } } },
      ]);
      const result = await service.drawRaffle({ tenantId: "t1", eventId: "e1", excludeStaff: true });
      expect(result.winners).toHaveLength(1);
      expect(result.winners[0].userName).toBe("Part");
    });

    it("should draw from all registered if rule is ALL_REGISTERED", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.ticket.findMany.mockResolvedValue([{ registrationId: "r1", registration: { id: "r1", user: { name: "P1", role: "PARTICIPANT" } } }]);
      const result = await service.drawRaffle({ tenantId: "t1", eventId: "e1", rule: "ALL_REGISTERED" });
      expect(result.winners).toHaveLength(1);
    });

    it("should draw from enrollments if rule is ALL_REGISTERED and activityId is provided", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.activityEnrollment.findMany.mockResolvedValue([{ registrationId: "r1", registration: { id: "r1", user: { name: "P1", role: "PARTICIPANT" } } }]);
      const result = await service.drawRaffle({ tenantId: "t1", eventId: "e1", activityId: "a1", rule: "ALL_REGISTERED" });
      expect(result.winners).toHaveLength(1);
    });

    it("should exclude past winners if uniqueWinners is true", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.attendance.findMany.mockResolvedValue([{ ticket: { registration: { id: "r1", user: { name: "W1", role: "P" } } } }]);
      mockPrismaService.raffleHistory.findMany.mockResolvedValue([{ registrationId: "r1" }]);
      const result = await service.drawRaffle({ tenantId: "t1", eventId: "e1", uniqueWinners: true });
      expect(result.winners).toHaveLength(0);
    });
  });

  describe("History and Prizes", () => {
    it("should list history with visibility", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.raffleHistory.findMany.mockResolvedValue([{ id: "h1", registration: { user: { name: "W" } } }]);
      const result = await service.getEventRaffleHistory("t1", "e1");
      expect(result).toHaveLength(1);
    });

    it("should set visibility hide/show", async () => {
      mockPrismaService.raffleHistory.findUnique.mockResolvedValue({ id: "h1", event: { tenantId: "t1" } });
      await service.setRaffleDisplayVisibility("t1", "h1", true);
      await service.setRaffleDisplayVisibility("t1", "h1", false);
      expect(mockPrismaService.raffleHistory.findUnique).toHaveBeenCalled();
    });

    it("should delete history if owner", async () => {
      mockPrismaService.raffleHistory.findUnique.mockResolvedValue({ id: "h1", event: { tenantId: "t1" } });
      await service.deleteRaffleHistory("t1", "h1");
      expect(mockPrismaService.raffleHistory.delete).toHaveBeenCalled();
    });

    it("should mark prize as received and award badge", async () => {
      mockPrismaService.raffleHistory.findUnique.mockResolvedValue({ id: "h1", eventId: "e1", event: { tenantId: "t1" }, registration: { userId: "u1" } });
      mockPrismaService.raffleHistory.update.mockResolvedValue({ id: "h1" });
      await service.markPrizeReceived("t1", "h1", true);
      expect(mockBadgesService.checkAndAwardBadge).toHaveBeenCalledWith("u1", "e1", "RAFFLE_WINNER");
    });
  });

  describe("undoCheckin", () => {
    it("should delete attendance", async () => {
      mockPrismaService.attendance.findUnique.mockResolvedValue({ id: "att1" });
      await service.undoCheckin("att1");
      expect(mockPrismaService.attendance.delete).toHaveBeenCalled();
    });

    it("should throw if not found", async () => {
      mockPrismaService.attendance.findUnique.mockResolvedValue(null);
      await expect(service.undoCheckin("att1")).rejects.toThrow(NotFoundException);
    });
  });
});
