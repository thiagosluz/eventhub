import { Test, TestingModule } from "@nestjs/testing";
import { TenantsService } from "./tenants.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";
import { MinioService } from "../storage/minio.service";

describe("TenantsService", () => {
  let service: TenantsService;
  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockMinioService = {
    uploadObject: jest.fn(),
    deleteObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MinioService, useValue: mockMinioService },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  describe("findAllPublic", () => {
    it("should return all active tenants", async () => {
      mockPrismaService.tenant.findMany.mockResolvedValue([]);
      const result = await service.findAllPublic();
      expect(result).toEqual([]);
      expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });
  });

  describe("findOnePublic", () => {
    it("should return tenant by slug if found and active", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: "t1",
        slug: "s1",
        isActive: true,
      });
      const result = await service.findOnePublic("s1");
      expect(result.id).toBe("t1");
    });

    it("should throw NotFoundException if slug not found", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      await expect(service.findOnePublic("invalid")).rejects.toThrow(
        "Organizador não encontrado",
      );
    });
  });

  describe("uploadLogo", () => {
    it("should upload logo and delete old one", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: "t1",
        logoUrl: "http://minio/event-media/old/logo.png",
      });
      mockMinioService.uploadObject.mockResolvedValue("http://minio/new-logo");
      mockPrismaService.tenant.update.mockResolvedValue({
        id: "t1",
        logoUrl: "new",
      });

      await service.uploadLogo("t1", {
        buffer: Buffer.from(""),
        mimetype: "image/png",
      });

      expect(mockMinioService.deleteObject).toHaveBeenCalledWith(
        "event-media",
        "old/logo.png",
      );
      expect(mockMinioService.uploadObject).toHaveBeenCalled();
    });
  });

  describe("uploadCover", () => {
    it("should upload cover and delete old one", async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: "t1",
        coverUrl: "http://minio/event-media/old/cover.png",
      });
      mockMinioService.uploadObject.mockResolvedValue("http://minio/new-cover");
      mockPrismaService.tenant.update.mockResolvedValue({
        id: "t1",
        coverUrl: "new",
      });

      await service.uploadCover("t1", {
        buffer: Buffer.from(""),
        mimetype: "image/png",
      });

      expect(mockMinioService.deleteObject).toHaveBeenCalledWith(
        "event-media",
        "old/cover.png",
      );
      expect(mockMinioService.uploadObject).toHaveBeenCalled();
    });
  });
});
