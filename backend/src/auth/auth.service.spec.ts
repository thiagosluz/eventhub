import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import { MailService } from "../mail/mail.service";
import * as argon2 from "argon2";

jest.mock("argon2");

describe("AuthService", () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
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
        service.login({ email: "test@example.com", password: "password" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if password does not match", async () => {
      const user = { email: "test@example.com", password: "hashed_password" };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: "test@example.com", password: "password" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should return access_token if credentials are valid", async () => {
      const user = {
        id: "user_id",
        email: "test@example.com",
        password: "hashed_password",
        role: "ORGANIZER",
        tenantId: "tenant_id",
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue("token");

      const result = await service.login({
        email: "test@example.com",
        password: "password",
      });

      expect(result).toEqual({
        access_token: "token",
        refresh_token: "token",
        user: {
          id: user.id,
          name: undefined,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
      });
    });
  });
});
