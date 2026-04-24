import { Test, TestingModule } from "@nestjs/testing";
import { AuthService, hashRefreshToken } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException, NotFoundException } from "@nestjs/common";
import { MailService } from "../mail/mail.service";
import { GamificationService } from "../gamification/gamification.service";
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
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockMailService = {
    enqueue: jest.fn(),
  };

  const mockGamificationService = {
    getXpForAction: jest.fn().mockResolvedValue(25),
    awardXp: jest.fn().mockResolvedValue({ xpGained: 25, isLevelUp: false }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
        { provide: GamificationService, useValue: mockGamificationService },
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

    it("should return session if valid and persist refresh token hash", async () => {
      const user = {
        id: "u1",
        email: "t@e.com",
        password: "h",
        role: "USER",
        tenantId: "t1",
        mustChangePassword: false,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue("tok");
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: "rt1" });

      const result = await service.login({
        email: "t@e.com",
        password: "p",
      });
      expect(result.access_token).toBe("tok");
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
      const createArgs = mockPrismaService.refreshToken.create.mock.calls[0][0];
      expect(createArgs.data.userId).toBe("u1");
      expect(createArgs.data.tokenHash).toBe(hashRefreshToken("tok"));
      expect(createArgs.data.expiresAt).toBeInstanceOf(Date);
    });

    it("persists request metadata when provided", async () => {
      const user = {
        id: "u1",
        email: "t@e.com",
        password: "h",
        role: "USER",
        tenantId: "t1",
        mustChangePassword: false,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue("tok");
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: "rt1" });

      await service.login(
        { email: "t@e.com", password: "p" },
        { userAgent: "Mozilla/5.0", ip: "1.2.3.4" },
      );
      const createArgs = mockPrismaService.refreshToken.create.mock.calls[0][0];
      expect(createArgs.data.userAgent).toBe("Mozilla/5.0");
      expect(createArgs.data.ip).toBe("1.2.3.4");
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
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: "rt1" });

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
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: "rt1" });

      const result = await service.registerParticipant({
        email: "p@e.com",
        password: "p",
        name: "Part",
      });
      expect(result.user.id).toBe("u1");
    });
  });

  describe("refresh", () => {
    it("should throw Unauthorized if refresh token empty", async () => {
      await expect(service.refresh("")).rejects.toThrow(UnauthorizedException);
    });

    it("should throw Unauthorized if refresh token not found", async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh("bad")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw Unauthorized if refresh token revoked", async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: "rt1",
        expiresAt: new Date(Date.now() + 1000),
        revokedAt: new Date(),
        user: { id: "u1", role: "USER", tenantId: "t1" },
      });
      await expect(service.refresh("tok")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw Unauthorized if refresh token expired", async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: "rt1",
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: null,
        user: { id: "u1", role: "USER", tenantId: "t1" },
      });
      await expect(service.refresh("tok")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should rotate token and return new session", async () => {
      const user = {
        id: "u1",
        email: "t@e.com",
        role: "USER",
        tenantId: "t1",
        mustChangePassword: false,
      };
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: "rt1",
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        user,
      });
      mockJwtService.signAsync.mockResolvedValue("new_tok");
      mockPrismaService.refreshToken.update.mockResolvedValue({ id: "rt1" });
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: "rt2" });

      const result = await service.refresh("valid");
      expect(result.access_token).toBe("new_tok");
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: "rt1" },
        data: { revokedAt: expect.any(Date) },
      });
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should revoke a specific refresh token when provided", async () => {
      await service.logout("u1", "sometoken");
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "u1",
          tokenHash: hashRefreshToken("sometoken"),
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("should revoke all active tokens when no token provided", async () => {
      await service.logout("u1");
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
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

    it("should update password and revoke refresh tokens", async () => {
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
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
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

describe("hashRefreshToken", () => {
  it("is deterministic and hex formatted", () => {
    const a = hashRefreshToken("abc");
    const b = hashRefreshToken("abc");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different hashes for different inputs", () => {
    expect(hashRefreshToken("abc")).not.toBe(hashRefreshToken("def"));
  });
});
