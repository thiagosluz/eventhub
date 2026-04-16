import { Test, TestingModule } from "@nestjs/testing";
import { CertificateTemplatesService } from "./certificate-templates.service";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { ForbiddenException, NotFoundException } from "@nestjs/common";

describe("CertificateTemplatesService", () => {
  let service: CertificateTemplatesService;

  const mockPrismaService: any = {
    event: {
      findFirst: jest.fn(),
    },
    certificateTemplate: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    issuedCertificate: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
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

  describe("listByEvent", () => {
    it("should list templates for an event", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue({ id: "event_1" });
      mockPrismaService.certificateTemplate.findMany.mockResolvedValue([]);

      const result = await service.listByEvent("tenant_1", "event_1");
      expect(result).toEqual([]);
      expect(mockPrismaService.certificateTemplate.findMany).toHaveBeenCalled();
    });

    it("should throw ForbiddenException if event not in tenant", async () => {
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      await expect(service.listByEvent("tenant_1", "event_1")).rejects.toThrow(
        ForbiddenException,
      );
    });
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

  describe("update", () => {
    it("should update template successfully", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_1",
      });
      mockPrismaService.certificateTemplate.update.mockResolvedValue({
        id: "tmpl_1",
        name: "Updated",
      });

      const result = await service.update("tenant_1", "tmpl_1", {
        name: "Updated",
      });
      expect(result.name).toBe("Updated");
    });
  });

  describe("uploadBackground", () => {
    it("should upload background and update template", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_1",
      });
      mockMinioService.uploadObject.mockResolvedValue("http://minio/new-bg");
      mockPrismaService.certificateTemplate.update.mockResolvedValue({
        id: "tmpl_1",
        backgroundUrl: "http://minio/new-bg",
      });

      const result = await service.uploadBackground("tenant_1", "tmpl_1", {
        buffer: Buffer.from("test"),
        mimetype: "image/png",
      });
      expect(result.backgroundUrl).toBe("http://minio/new-bg");
    });
  });

  describe("delete", () => {
    const mockTemplate = {
      id: "tmpl_1",
      _count: { issuedCertificates: 0 },
    };

    it("should delete template if no certificates are issued", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue(
        mockTemplate,
      );
      await service.delete("tenant_1", "tmpl_1");
      expect(mockPrismaService.certificateTemplate.delete).toHaveBeenCalled();
    });

    it("should throw ConflictException if certificates are issued and not forced", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        ...mockTemplate,
        _count: { issuedCertificates: 10 },
      });
      await expect(service.delete("tenant_1", "tmpl_1")).rejects.toThrow(
        "Não é possível excluir um template que já possui certificados emitidos",
      );
    });

    it("should throw ConflictException if forced but confirm word is wrong", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        ...mockTemplate,
        _count: { issuedCertificates: 10 },
      });
      await expect(
        service.delete("tenant_1", "tmpl_1", true, "WRONG"),
      ).rejects.toThrow("você deve digitar a palavra de segurança 'DELETAR'");
    });

    it("should delete template and certificates if forced and confirmed", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        ...mockTemplate,
        _count: { issuedCertificates: 10 },
      });
      await service.delete("tenant_1", "tmpl_1", true, "DELETAR");
      expect(mockPrismaService.issuedCertificate.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.certificateTemplate.delete).toHaveBeenCalled();
    });
  });

  describe("duplicate", () => {
    it("should duplicate a template", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_orig",
        name: "Original",
        eventId: "event_1",
        backgroundUrl: "bg",
        layoutConfig: {},
      });
      mockPrismaService.certificateTemplate.create.mockResolvedValue({
        id: "tmpl_copy",
        name: "Original (Cópia)",
      });

      const result = await service.duplicate("tenant_1", "tmpl_orig");
      expect(result.name).toBe("Original (Cópia)");
      expect(mockPrismaService.certificateTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Original (Cópia)" }),
        }),
      );
    });
  });
});
