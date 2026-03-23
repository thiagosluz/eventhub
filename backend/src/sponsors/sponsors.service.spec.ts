import { Test, TestingModule } from "@nestjs/testing";
import { SponsorsService } from "./sponsors.service";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { NotFoundException } from "@nestjs/common";

describe("SponsorsService", () => {
  let service: SponsorsService;

  const mockPrismaService = {
    event: {
      findFirst: jest.fn(),
    },
    sponsorCategory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sponsor: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockMinioService = {
    uploadObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SponsorsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MinioService, useValue: mockMinioService },
      ],
    }).compile();

    service = module.get<SponsorsService>(SponsorsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createCategory", () => {
    it("should create a sponsor category", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.sponsorCategory.create.mockResolvedValue({
        id: "c1",
        name: "Gold",
      });

      const result = await service.createCategory("t1", "e1", { name: "Gold" });
      expect(result.name).toBe("Gold");
    });

    it("should throw NotFound if event not in tenant", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(
        service.createCategory("t1", "e1", { name: "Gold" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("Categories Management", () => {
    it("should list categories for an event", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.sponsorCategory.findMany.mockResolvedValue([]);
      const result = await service.listCategoriesByEvent("t1", "e1");
      expect(result).toBeDefined();
    });

    it("should update a category", async () => {
      mockPrismaService.sponsorCategory.findUnique.mockResolvedValue({
        id: "c1",
        event: { tenantId: "t1" },
      });
      mockPrismaService.sponsorCategory.update.mockResolvedValue({ id: "c1" });
      await service.updateCategory("t1", "c1", { name: "Plat" });
      expect(mockPrismaService.sponsorCategory.update).toHaveBeenCalled();
    });

    it("should delete a category", async () => {
      mockPrismaService.sponsorCategory.findUnique.mockResolvedValue({
        id: "c1",
        event: { tenantId: "t1" },
      });
      mockPrismaService.sponsorCategory.delete.mockResolvedValue({ id: "c1" });
      await service.deleteCategory("t1", "c1");
      expect(mockPrismaService.sponsorCategory.delete).toHaveBeenCalled();
    });
  });

  describe("createSponsor", () => {
    it("should create a sponsor in a category", async () => {
      mockPrismaService.sponsorCategory.findUnique.mockResolvedValue({
        id: "c1",
        event: { tenantId: "t1" },
      });
      mockPrismaService.sponsor.create.mockResolvedValue({
        id: "sp1",
        name: "Google",
      });

      const result = await service.createSponsor("t1", {
        categoryId: "c1",
        name: "Google",
      });
      expect(result.name).toBe("Google");
    });
  });

  describe("updateSponsor", () => {
    it("should update sponsor if owner", async () => {
      mockPrismaService.sponsor.findUnique.mockResolvedValue({
        id: "s1",
        category: { event: { tenantId: "t1" } },
      });
      mockPrismaService.sponsor.update.mockResolvedValue({ id: "s1" });

      await service.updateSponsor("t1", "s1", { name: "Alphabet" });
      expect(mockPrismaService.sponsor.update).toHaveBeenCalled();
    });

    it("should throw NotFound if sponsor not in tenant", async () => {
      mockPrismaService.sponsor.findUnique.mockResolvedValue({
        id: "s1",
        category: { event: { tenantId: "other" } },
      });
      await expect(
        service.updateSponsor("t1", "s1", { name: "X" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteSponsor", () => {
    it("should delete sponsor", async () => {
      mockPrismaService.sponsor.findUnique.mockResolvedValue({
        id: "s1",
        category: { event: { tenantId: "t1" } },
      });
      mockPrismaService.sponsor.delete.mockResolvedValue({ id: "s1" });
      await service.deleteSponsor("t1", "s1");
      expect(mockPrismaService.sponsor.delete).toHaveBeenCalled();
    });
  });

  describe("uploadLogo", () => {
    it("should upload and update sponsor logo", async () => {
      mockPrismaService.sponsor.findUnique.mockResolvedValue({
        id: "s1",
        category: { event: { tenantId: "t1", id: "e1" } },
      });
      mockMinioService.uploadObject.mockResolvedValue("http://logo.com");
      mockPrismaService.sponsor.update.mockResolvedValue({ id: "s1" });

      await service.uploadLogo("t1", "s1", {
        buffer: Buffer.from(""),
        mimetype: "image/png",
      });

      expect(mockMinioService.uploadObject).toHaveBeenCalled();
      expect(mockPrismaService.sponsor.update).toHaveBeenCalled();
    });
  });

  describe("Public", () => {
    it("should list public sponsors", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "e1" });
      mockPrismaService.sponsorCategory.findMany.mockResolvedValue([]);
      const result = await service.listPublicSponsorsByEventSlug("slug");
      expect(result).toBeDefined();
    });
  });

  describe("Edge cases - tenant mismatch", () => {
    it("should throw on updateCategory mismatch", async () => {
      mockPrismaService.sponsorCategory.findUnique.mockResolvedValue({ event: { tenantId: "other" } });
      await expect(service.updateCategory("t1", "c1", {})).rejects.toThrow(NotFoundException);
    });

    it("should throw on deleteCategory mismatch", async () => {
      mockPrismaService.sponsorCategory.findUnique.mockResolvedValue({ event: { tenantId: "other" } });
      await expect(service.deleteCategory("t1", "c1")).rejects.toThrow(NotFoundException);
    });

    it("should throw on createSponsor with category mismatch", async () => {
      mockPrismaService.sponsorCategory.findUnique.mockResolvedValue({ event: { tenantId: "other" } });
      await expect(service.createSponsor("t1", { categoryId: "c1", name: "S" })).rejects.toThrow(NotFoundException);
    });

    it("should throw on deleteSponsor mismatch", async () => {
      mockPrismaService.sponsor.findUnique.mockResolvedValue({ category: { event: { tenantId: "other" } } });
      await expect(service.deleteSponsor("t1", "s1")).rejects.toThrow(NotFoundException);
    });

    it("should throw on uploadLogo mismatch", async () => {
      mockPrismaService.sponsor.findUnique.mockResolvedValue({ category: { event: { tenantId: "other" } } });
      await expect(service.uploadLogo("t1", "s1", { buffer: Buffer.from(""), mimetype: "image/png" })).rejects.toThrow(NotFoundException);
    });
  });
});
