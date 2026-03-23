import { Test, TestingModule } from "@nestjs/testing";
import { CertificateTemplatesService } from "./certificate-templates.service";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { ForbiddenException, NotFoundException } from "@nestjs/common";

describe("CertificateTemplatesService", () => {
  let service: CertificateTemplatesService;

  const mockPrismaService = {
    event: {
      findFirst: jest.fn(),
    },
    certificateTemplate: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockMinioService = {
    uploadObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificateTemplatesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MinioService, useValue: mockMinioService },
      ],
    }).compile();

    service = module.get<CertificateTemplatesService>(
      CertificateTemplatesService,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should throw ForbiddenException if event not in tenant", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(
        service.create("tenant_1", "event_1", {
          name: "T1",
          backgroundUrl: "url",
          layoutConfig: {},
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should create template successfully", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "event_1" });
      mockPrismaService.certificateTemplate.create.mockResolvedValue({
        id: "tmpl_1",
      });

      const result = await service.create("tenant_1", "event_1", {
        name: "T1",
        backgroundUrl: "url",
        layoutConfig: {},
      });
      expect(result.id).toBe("tmpl_1");
    });
  });

  describe("findOne", () => {
    it("should throw NotFoundException if template not found", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue(null);
      await expect(service.findOne("tenant_1", "tmpl_1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return template successfully", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_1",
      });
      const result = await service.findOne("tenant_1", "tmpl_1");
      expect(result.id).toBe("tmpl_1");
    });
  });
});
