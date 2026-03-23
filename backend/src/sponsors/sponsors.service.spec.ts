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
});
