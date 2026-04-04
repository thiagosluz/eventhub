import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException, NotFoundException } from "@nestjs/common";
import { MailService } from "../mail/mail.service";
import * as argon2 from "argon2";

jest.mock("argon2");

describe("AuthService", () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockMailService = {
    enqueue: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("login", () => {
    it("should throw UnauthorizedException if user not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: "t@e.com", password: "p" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should return session if valid", async () => {
      const user = {
        id: "u1",
        email: "t@e.com",
        password: "h",
        role: "USER",
        tenantId: "t1",
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue("tok");

      const result = await service.login({ email: "t@e.com", password: "p" });
      expect(result.access_token).toBe("tok");
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });

  describe("registerOrganizer", () => {
    it("should throw UnauthorizedException if email exists", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "u1" });
      await expect(
        service.registerOrganizer({ email: "t@e.com" } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should create user and tenant", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue({ id: "t1" });
      mockPrismaService.user.create.mockResolvedValue({
        id: "u1",
        email: "t@e.com",
      });
      mockJwtService.signAsync.mockResolvedValue("tok");
      (argon2.hash as jest.Mock).mockResolvedValue("hashed");

      const result = await service.registerOrganizer({
        email: "t@e.com",
        password: "p",
        name: "User",
        tenantName: "T1",
        tenantSlug: "t1",
      });
      expect(result.user.id).toBe("u1");
      expect(mockPrismaService.tenant.create).toHaveBeenCalled();
    });
  });

  describe("registerParticipant", () => {
    it("should create user and tenant with participant role", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue({ id: "t1" });
      mockPrismaService.user.create.mockResolvedValue({
        id: "u1",
        email: "p@e.com",
        role: "PARTICIPANT",
      });
      mockJwtService.signAsync.mockResolvedValue("tok");
      (argon2.hash as jest.Mock).mockResolvedValue("hashed");

      const result = await service.registerParticipant({
        email: "p@e.com",
        password: "p",
        name: "Part",
      });
      expect(result.user.id).toBe("u1");
    });
  });

  describe("refresh", () => {
    it("should throw Unauthorized if refresh token invalid", async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      await expect(service.refresh("bad")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should return new session", async () => {
      const user = { id: "u1", email: "t@e.com", role: "USER", tenantId: "t1" };
      mockPrismaService.user.findFirst.mockResolvedValue(user);
      mockJwtService.signAsync.mockResolvedValue("new_tok");

      const result = await service.refresh("valid");
      expect(result.access_token).toBe("new_tok");
    });
  });

  describe("logout", () => {
    it("should clear refresh token", async () => {
      await service.logout("u1");
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { refreshToken: null },
      });
    });
  });

  describe("forgotPassword", () => {
    it("should throw NotFound if user not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.forgotPassword("non@e.com")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should send email if user found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "found@e.com",
      });
      await service.forgotPassword("found@e.com");
      expect(mockMailService.enqueue).toHaveBeenCalled();
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("should throw Unauthorized if token invalid or expired", async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword("bad", "newp")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should update password if token valid", async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: "u1",
        email: "t@e.com",
      });
      (argon2.hash as jest.Mock).mockResolvedValue("new_hashed");
      await service.resetPassword("valid", "newp");
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "u1" },
          data: expect.objectContaining({ password: "new_hashed" }),
        }),
      );
    });
  });

  describe("changeForcedPassword", () => {
    it("should update password", async () => {
      (argon2.hash as jest.Mock).mockResolvedValue("forced_hashed");
      await service.changeForcedPassword("u1", "forcedp");
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { password: "forced_hashed", mustChangePassword: false },
      });
    });
  });
});
