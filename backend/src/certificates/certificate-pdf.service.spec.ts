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
  });
});
