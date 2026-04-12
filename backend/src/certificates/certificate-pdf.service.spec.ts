import { Test, TestingModule } from "@nestjs/testing";
import { CertificatePdfService } from "./certificate-pdf.service";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { NotFoundException } from "@nestjs/common";

// 1x1 transparent PNG
const validPngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  "base64",
);

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    arrayBuffer: () => Promise.resolve(new Uint8Array(validPngBuffer).buffer),
  }),
) as jest.Mock;

describe("CertificatePdfService", () => {
  let service: CertificatePdfService;

  const mockPrismaService = {
    certificateTemplate: {
      findFirst: jest.fn(),
    },
    registration: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
    },
    issuedCertificate: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockMinioService = {
    uploadObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatePdfService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MinioService, useValue: mockMinioService },
      ],
    }).compile();

    service = module.get<CertificatePdfService>(CertificatePdfService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateAndStore", () => {
    it("should throw NotFoundException if template not found", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue(null);
      await expect(service.generateAndStore("tmpl_1", "reg_1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should generate and store certificate successfully", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_1",
        eventId: "event_1",
        backgroundUrl: "http://test.com/bg.png",
        layoutConfig: { placeholders: [] },
        event: { name: "Test Event" },
      });
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg_1",
        user: { name: "User 1" },
        event: { name: "Test Event" },
      });
      mockPrismaService.issuedCertificate.findFirst.mockResolvedValue(null);
      mockPrismaService.attendance.findMany.mockResolvedValue([]);
      mockMinioService.uploadObject.mockResolvedValue("http://minio/cert.pdf");
      mockPrismaService.issuedCertificate.create.mockResolvedValue({
        id: "issued_1",
      });

      const result = await service.generateAndStore("tmpl_1", "reg_1");

      expect(result.fileUrl).toBe("http://minio/cert.pdf");
      expect(mockMinioService.uploadObject).toHaveBeenCalled();
      expect(mockPrismaService.issuedCertificate.create).toHaveBeenCalled();
    });
  });
});
