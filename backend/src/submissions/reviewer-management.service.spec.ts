import { Test, TestingModule } from "@nestjs/testing";
import { ReviewerManagementService } from "./reviewer-management.service";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { InvitationStatus } from "../generated/prisma";
import * as argon2 from "argon2";

jest.mock("argon2");

describe("ReviewerManagementService", () => {
  let service: ReviewerManagementService;

  const mockPrisma: any = {
    event: {
      findUnique: jest.fn(),
    },
    reviewerInvitation: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    eventReviewer: {
      upsert: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: any): any => cb(mockPrisma)),
  };

  const mockMail = {
    enqueue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewerManagementService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();

    service = module.get<ReviewerManagementService>(ReviewerManagementService);
  });

  describe("inviteReviewer", () => {
    it("should send an invitation email", async () => {
      (mockPrisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: "ev-1",
        name: "Event 1",
      });
      (mockPrisma.reviewerInvitation.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await service.inviteReviewer(
        "ev-1",
        "test@test.com",
        "user-1",
      );

      expect(result.message).toBe("Convite enviado com sucesso");
      expect(mockMail.enqueue).toHaveBeenCalled();
      expect(mockPrisma.reviewerInvitation.upsert).toHaveBeenCalled();
    });

    it("should throw NotFoundException if event is missing", async () => {
      (mockPrisma.event.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.inviteReviewer("ev-1", "test@test.com", "user-1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("manualRegister", () => {
    it("should create a new reviewer with temporary password", async () => {
      (mockPrisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: "ev-1",
        tenantId: "t-1",
      });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue("hashed-pass");
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({ id: "u-1" });

      const result = await service.manualRegister("ev-1", {
        email: "new@reviewer.com",
        name: "New Reviewer",
        temporaryPassword: "temp-password",
      });

      expect(result.userId).toBe("u-1");
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mustChangePassword: true }),
        }),
      );
    });

    it("should add existing user to committee", async () => {
      (mockPrisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: "ev-1",
      });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "existing-u-1",
      });

      const result = await service.manualRegister("ev-1", {
        email: "ex@reviewer.com",
        name: "Existing",
        temporaryPassword: "...",
      });

      expect(result.message).toContain("já existia");
      expect(mockPrisma.eventReviewer.upsert).toHaveBeenCalled();
    });
  });

  describe("acceptInvitation", () => {
    const dto = { token: "tok-1", name: "Accepted", password: "pass" };

    it("should throw NotFound if invitation missing", async () => {
      (mockPrisma.reviewerInvitation.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      await expect(service.acceptInvitation(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequest if invitation already accepted", async () => {
      (mockPrisma.reviewerInvitation.findUnique as jest.Mock).mockResolvedValue(
        { status: InvitationStatus.ACCEPTED },
      );
      await expect(service.acceptInvitation(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequest if invitation expired", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      (mockPrisma.reviewerInvitation.findUnique as jest.Mock).mockResolvedValue(
        {
          status: InvitationStatus.PENDING,
          expiresAt: pastDate,
        },
      );
      await expect(service.acceptInvitation(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should complete registration and accept invitation", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      (mockPrisma.reviewerInvitation.findUnique as jest.Mock).mockResolvedValue(
        {
          id: "inv-1",
          status: InvitationStatus.PENDING,
          expiresAt: futureDate,
          email: "acc@test.com",
          event: { tenantId: "t-1", id: "ev-1" },
        },
      );
      (argon2.hash as jest.Mock).mockResolvedValue("hashed");
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({ id: "u-1" });

      const result = await service.acceptInvitation(dto);
      expect(result.userId).toBe("u-1");
      expect(mockPrisma.reviewerInvitation.update).toHaveBeenCalled();
      expect(mockPrisma.eventReviewer.create).toHaveBeenCalled();
    });
  });

  describe("getInvitation", () => {
    it("should return public invitation info", async () => {
      (mockPrisma.reviewerInvitation.findUnique as jest.Mock).mockResolvedValue(
        { email: "test@ex.com" },
      );
      const result = await service.getInvitation("token-1");
      expect(result.email).toBe("test@ex.com");
    });

    it("should throw NotFound if invitation missing", async () => {
      (mockPrisma.reviewerInvitation.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      await expect(service.getInvitation("token-1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
