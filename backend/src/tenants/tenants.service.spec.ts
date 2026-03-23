import { Test, TestingModule } from "@nestjs/testing";
import { TenantsService } from "./tenants.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("TenantsService", () => {
  let service: TenantsService;
  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getTenant", () => {
    it("should return a tenant if found", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: "t1",
        name: "Tenant 1",
      });
      const result = await service.getTenant("t1");
      expect(result.id).toBe("t1");
    });

    it("should throw NotFoundException if tenant not found", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      await expect(service.getTenant("invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateTenant", () => {
    it("should update and return the tenant", async () => {
      const dto = { name: "Updated Name" };
      mockPrismaService.tenant.update.mockResolvedValue({ id: "t1", ...dto });
      const result = await service.updateTenant("t1", dto as any);
      expect(result.name).toBe("Updated Name");
    });
  });

  describe("getPublicTenant", () => {
    it("should return public info of the first tenant", async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        name: "EventHub",
        logoUrl: "logo.png",
        themeConfig: {},
      });
      const result = await service.getPublicTenant();
      expect(result?.name).toBe("EventHub");
    });

    it("should return null if no tenant exists", async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(null);
      const result = await service.getPublicTenant();
      expect(result).toBeNull();
    });
  });
});
