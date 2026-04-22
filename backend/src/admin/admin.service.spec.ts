import { Test, TestingModule } from "@nestjs/testing";
import { AdminService } from "./admin.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { NotFoundException, ConflictException } from "@nestjs/common";
import * as argon2 from "argon2";
import { MailService } from "../mail/mail.service";

jest.mock("argon2", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
}));

describe("AdminService", () => {
  let service: AdminService;

  const mockPrismaService: any = {
    tenant: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    event: {
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue("mock_token"),
  };

  const mockMailService = {
    enqueue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("listTenants", () => {
    it("should return paginated tenants", async () => {
      mockPrismaService.tenant.findMany.mockResolvedValue([]);
      mockPrismaService.tenant.count.mockResolvedValue(0);

      const result = await service.listTenants(1, 10);
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
    });

    it("should use default args for paginated tenants", async () => {
      mockPrismaService.tenant.findMany.mockResolvedValue([]);
      mockPrismaService.tenant.count.mockResolvedValue(0);

      const result = await service.listTenants();
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
    });
  });

  describe("toggleTenantStatus", () => {
    it("should throw NotFoundException if tenant missing", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      await expect(service.toggleTenantStatus("id", true)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should update tenant status", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ id: "id" });
      mockPrismaService.tenant.update.mockResolvedValue({
        id: "id",
        isActive: true,
      });

      const result = await service.toggleTenantStatus("id", true);
      expect(result.isActive).toBe(true);
    });
  });

  describe("getGlobalAuditLogs", () => {
    it("should return paginated logs with filters", async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      const result = await service.getGlobalAuditLogs(1, 20, {
        tenantId: "t1",
        userId: "u1",
        action: "TEST",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
      expect(result.data).toEqual([]);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalled();
    });

    it("should return paginated logs with default arguments", async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      const result = await service.getGlobalAuditLogs();
      expect(result.data).toEqual([]);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalled();
    });
  });

  describe("getGlobalStats", () => {
    it("should return platform statistics", async () => {
      mockPrismaService.tenant.count.mockResolvedValue(5);
      mockPrismaService.event.count.mockResolvedValue(10);
      mockPrismaService.user.count.mockResolvedValue(100);
      mockPrismaService.auditLog.groupBy.mockResolvedValue([]);

      const result = await service.getGlobalStats();
      expect(result.totalTenants).toBe(5);
      expect(result.totalEvents).toBe(10);
      expect(result.totalUsers).toBe(100);
    });
  });

  describe("impersonateUser", () => {
    it("should throw NotFoundException if target user missing", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.impersonateUser("target", "admin")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return tokens for impersonation", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "target",
        email: "test@test.com",
        tenantId: "t1",
        role: "USER",
      });

      const result = await service.impersonateUser("target", "admin");
      expect(result.access_token).toBe("mock_token");
      expect(result.user.id).toBe("target");
    });
  });

  describe("createTenant", () => {
    it("should throw ConflictException if slug exists", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ id: "exists" });
      await expect(
        service.createTenant({
          name: "N",
          slug: "S",
          adminEmail: "e",
          adminName: "n",
          adminPassword: "p",
        }),
      ).rejects.toThrow("Este slug já está sendo utilizado");
    });

    it("should throw ConflictException if admin email exists", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "exists" });
      await expect(
        service.createTenant({
          name: "N",
          slug: "S",
          adminEmail: "e",
          adminName: "n",
          adminPassword: "p",
        }),
      ).rejects.toThrow("Este e-mail de administrador já está registrado");
    });

    it("should create tenant and admin in transaction", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue({
        id: "t1",
        slug: "S",
      });
      mockPrismaService.user.create.mockResolvedValue({ id: "u1", email: "e" });

      const result = await service.createTenant({
        name: "N",
        slug: "S",
        adminEmail: "e",
        adminName: "n",
        adminPassword: "p",
      });
      expect(result.tenant.id).toBe("t1");
      expect(result.admin.id).toBe("u1");
    });
  });

  describe("listTenantUsers", () => {
    it("should list users of a specific tenant", async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      const result = await service.listTenantUsers("t1");
      expect(result).toEqual([]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: "t1" } }),
      );
    });
  });

  describe("listGlobalUsers", () => {
    it("should return paginated global users", async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await service.listGlobalUsers(1, 20, {
        search: "test",
        role: "ORGANIZER",
        tenantId: "t1",
      });
      expect(result.data).toEqual([]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });

    it("should return paginated global users with default arguments", async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await service.listGlobalUsers();
      expect(result.data).toEqual([]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });
  });

  describe("updateGlobalUser", () => {
    it("should throw NotFoundException if user missing", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.updateGlobalUser("id", {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ConflictException if email already in use", async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ id: "id", email: "old@test.com" })
        .mockResolvedValueOnce({ id: "other", email: "new@test.com" });

      await expect(
        service.updateGlobalUser("id", { email: "new@test.com" }),
      ).rejects.toThrow(ConflictException);
    });

    it("should update user successfully", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "id",
        email: "old@test.com",
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: "id",
        name: "New",
      });

      const result = await service.updateGlobalUser("id", { name: "New" });
      expect(result.name).toBe("New");
    });
  });

  describe("resetGlobalUserPassword", () => {
    it("should throw NotFoundException if user missing", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.resetGlobalUserPassword("id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns ok without exposing password and sends email", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "id",
        email: "user@example.com",
      });
      mockPrismaService.user.update.mockResolvedValue({ id: "id" });

      const result = await service.resetGlobalUserPassword("id");

      expect(result).toEqual({ ok: true, email: "user@example.com" });
      expect(JSON.stringify(result)).not.toMatch(/senha|password/i);
      expect(argon2.hash).toHaveBeenCalled();
      expect(mockMailService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ to: "user@example.com" }),
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mustChangePassword: true }),
        }),
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalled();
    });

    it("generates a different temporary password each call", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "id",
        email: "u@e.com",
      });
      const hashes: string[] = [];
      (argon2.hash as jest.Mock).mockImplementation(async (pwd: string) => {
        hashes.push(pwd);
        return "hashed";
      });
      await service.resetGlobalUserPassword("id");
      await service.resetGlobalUserPassword("id");
      expect(hashes).toHaveLength(2);
      expect(hashes[0]).not.toBe(hashes[1]);
      expect(hashes[0]).toMatch(/^EH-/);
    });
  });
});
