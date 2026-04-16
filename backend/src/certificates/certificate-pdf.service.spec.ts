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
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    activitySpeaker: {
      findFirst: jest.fn(),
    },
    eventMonitor: {
      findFirst: jest.fn(),
    },
    review: {
      count: jest.fn(),
    },
    thematicArea: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
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
      await expect(
        service.generateAndStore("tmpl_1", { registrationId: "reg_1" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should generate a PARTICIPANT certificate successfully", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_1",
        eventId: "event_1",
        backgroundUrl: "http://test.com/bg.png",
        layoutConfig: { textBlocks: [] },
        event: {
          name: "Test Event",
          startDate: new Date(),
          endDate: new Date(),
        },
        category: "PARTICIPANT",
      });
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg_1",
        user: { name: "User Participant", cpf: "123.456.789-00" },
        event: { name: "Test Event" },
      });
      mockPrismaService.issuedCertificate.findFirst.mockResolvedValue(null);
      mockPrismaService.attendance.findMany.mockResolvedValue([]);
      mockMinioService.uploadObject.mockResolvedValue(
        "http://minio/cert-p.pdf",
      );
      mockPrismaService.issuedCertificate.create.mockResolvedValue({
        id: "issued_1",
      });

      const result = await service.generateAndStore("tmpl_1", {
        registrationId: "reg_1",
      });

      expect(result.fileUrl).toBe("http://minio/cert-p.pdf");
      expect(mockPrismaService.registration.findFirst).toHaveBeenCalled();
    });

    it("should generate a SPEAKER certificate successfully", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_speaker",
        eventId: "event_1",
        backgroundUrl: "http://test.com/bg.png",
        layoutConfig: { textBlocks: [] },
        event: { name: "Test Event" },
        category: "SPEAKER",
      });
      mockPrismaService.activitySpeaker.findFirst.mockResolvedValue({
        speaker: { name: "Speaker Name", user: { name: "Speaker Name" } },
        activity: { title: "Test Workshop", type: { name: "Workshop" } },
        role: { name: "Coordinator" },
      });
      mockPrismaService.issuedCertificate.findFirst.mockResolvedValue(null);
      mockMinioService.uploadObject.mockResolvedValue(
        "http://minio/cert-s.pdf",
      );
      mockPrismaService.issuedCertificate.create.mockResolvedValue({
        id: "issued_2",
      });

      const result = await service.generateAndStore("tmpl_speaker", {
        userId: "user_s",
        activityId: "act_1",
      });

      expect(result.fileUrl).toBe("http://minio/cert-s.pdf");
      expect(mockPrismaService.activitySpeaker.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ activityId: "act_1" }),
        }),
      );
    });

    it("should generate a REVIEWER certificate successfully", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_reviewer",
        eventId: "event_1",
        backgroundUrl: "http://test.com/bg.png",
        layoutConfig: { textBlocks: [] },
        event: { name: "Test Event" },
        category: "REVIEWER",
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        name: "Reviewer Name",
      });
      mockPrismaService.review.count.mockResolvedValue(5);
      mockPrismaService.thematicArea.findMany.mockResolvedValue([
        { name: "Tech" },
        { name: "Health" },
      ]);
      mockPrismaService.issuedCertificate.findFirst.mockResolvedValue(null);
      mockMinioService.uploadObject.mockResolvedValue(
        "http://minio/cert-r.pdf",
      );
      mockPrismaService.issuedCertificate.create.mockResolvedValue({
        id: "issued_3",
      });

      const result = await service.generateAndStore("tmpl_reviewer", {
        userId: "user_r",
      });

      expect(result.fileUrl).toBe("http://minio/cert-r.pdf");
      expect(mockPrismaService.review.count).toHaveBeenCalled();
      expect(mockPrismaService.thematicArea.findMany).toHaveBeenCalled();
    });

    it("should generate a MONITOR certificate successfully", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_monitor",
        eventId: "event_1",
        backgroundUrl: "http://test.com/bg.png",
        layoutConfig: { textBlocks: [] },
        event: { name: "Test Event" },
        category: "MONITOR",
      });
      mockPrismaService.eventMonitor.findFirst.mockResolvedValue({
        user: { name: "Monitor Name" },
      });
      mockPrismaService.issuedCertificate.findFirst.mockResolvedValue(null);
      mockMinioService.uploadObject.mockResolvedValue(
        "http://minio/cert-m.pdf",
      );
      mockPrismaService.issuedCertificate.create.mockResolvedValue({
        id: "issued_4",
      });

      const result = await service.generateAndStore("tmpl_monitor", {
        userId: "user_m",
      });

      expect(result.fileUrl).toBe("http://minio/cert-m.pdf");
      expect(mockPrismaService.eventMonitor.findFirst).toHaveBeenCalled();
    });

    it("should handle overwrite strategy", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_1",
        eventId: "event_1",
        backgroundUrl: "http://test.com/bg.png",
        layoutConfig: { textBlocks: [] },
        event: { name: "Test Event" },
        category: "PARTICIPANT",
      });
      mockPrismaService.issuedCertificate.findFirst.mockResolvedValue({
        id: "existing_1",
        fileUrl: "http://minio/old.pdf",
      });
      mockMinioService.uploadObject.mockResolvedValue("http://minio/new.pdf");
      mockPrismaService.issuedCertificate.update.mockResolvedValue({
        id: "existing_1",
        fileUrl: "http://minio/new.pdf",
      });

      const result = await service.generateAndStore(
        "tmpl_1",
        { registrationId: "reg_1" },
        "overwrite",
      );

      expect(result.fileUrl).toBe("http://minio/new.pdf");
      expect(mockPrismaService.issuedCertificate.update).toHaveBeenCalled();
    });

    it("should render complex text blocks with bold fragments", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_text",
        eventId: "event_1",
        backgroundUrl: "http://test.com/bg.png",
        layoutConfig: {
          textBlocks: [
            {
              text: "Hello {{participantName}}, welcome to {{eventName}}!",
              x: 50,
              y: 100,
              bold: true,
            },
          ],
        },
        event: { name: "Special Event" },
        category: "PARTICIPANT",
      });
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg_1",
        user: { name: "John Doe" },
      });
      mockPrismaService.issuedCertificate.findFirst.mockResolvedValue(null);
      mockPrismaService.attendance.findMany.mockResolvedValue([]);
      mockMinioService.uploadObject.mockResolvedValue("http://minio/url");
      mockPrismaService.issuedCertificate.create.mockResolvedValue({
        id: "issued_5",
      });

      await service.generateAndStore("tmpl_text", { registrationId: "reg_1" });

      expect(mockMinioService.uploadObject).toHaveBeenCalled();
    });

    it("should handle large attendance lists forcing page breaks", async () => {
      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_large",
        eventId: "event_1",
        backgroundUrl: "http://test.com/bg.png",
        layoutConfig: { textBlocks: [] },
        event: { name: "Test Event" },
        category: "PARTICIPANT",
      });
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg_1",
        user: { name: "User" },
      });
      mockPrismaService.issuedCertificate.findFirst.mockResolvedValue(null);

      // Create 50 attendances to force multiple pages
      const manyAttendances = Array.from({ length: 50 }, (_, i) => ({
        checkedAt: new Date(),
        activity: {
          title: `Activity ${i}`,
          startAt: new Date(),
          endAt: new Date(Date.now() + 3600000),
        },
      }));
      mockPrismaService.attendance.findMany.mockResolvedValue(manyAttendances);
      mockMinioService.uploadObject.mockResolvedValue("http://minio/url");
      mockPrismaService.issuedCertificate.create.mockResolvedValue({
        id: "issued_6",
      });

      await service.generateAndStore("tmpl_large", { registrationId: "reg_1" });

      expect(mockMinioService.uploadObject).toHaveBeenCalled();
    });

    it("should throw error if fetchImage fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
        id: "tmpl_err",
        eventId: "event_1",
        backgroundUrl: "http://test.com/bg.png",
        layoutConfig: { textBlocks: [] },
        event: { name: "Test Event" },
        category: "PARTICIPANT",
      });
      mockPrismaService.registration.findFirst.mockResolvedValue({
        id: "reg_1",
        user: { name: "User" },
      });

      await expect(
        service.generateAndStore("tmpl_err", { registrationId: "reg_1" }),
      ).rejects.toThrow("Falha ao carregar imagem do certificado");
    });
  });

  describe("generatePreview", () => {
    it("should generate a preview PDF buffer", async () => {
      const result = await service.generatePreview({
        backgroundUrl: "http://test.com/bg.png",
        layoutConfig: {
          textBlocks: [{ text: "Preview Text", x: 10, y: 10 }],
        },
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(global.fetch).toHaveBeenCalledWith("http://test.com/bg.png");
    });
  });
});
