import { Test, TestingModule } from "@nestjs/testing";
import { CertificatesController } from "./certificates.controller";
import { CertificatePdfService } from "./certificate-pdf.service";
import { CertificateTemplatesService } from "./certificate-templates.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("CertificatesController", () => {
  let controller: CertificatesController;
  let templatesService: CertificateTemplatesService;

  const mockPdfService = {
    generatePreview: jest.fn(),
    generateAndStore: jest.fn(),
  };

  const mockTemplatesService = {
    listByEvent: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    uploadBackground: jest.fn(),
  };

  const mockMailService = {
    enqueue: jest.fn(),
  };

  const mockPrismaService = {
    registration: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    issuedCertificate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockRequest = {
    user: {
      sub: "user_id",
      tenantId: "tenant_id",
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificatesController],
      providers: [
        { provide: CertificatePdfService, useValue: mockPdfService },
        {
          provide: CertificateTemplatesService,
          useValue: mockTemplatesService,
        },
        { provide: MailService, useValue: mockMailService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CertificatesController>(CertificatesController);
    templatesService = module.get<CertificateTemplatesService>(
      CertificateTemplatesService,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("Templates", () => {
    it("should list templates", async () => {
      await controller.listTemplates("e1", mockRequest);
      expect(templatesService.listByEvent).toHaveBeenCalledWith(
        "tenant_id",
        "e1",
      );
    });

    it("should create template", async () => {
      const body = { name: "T1", backgroundUrl: "url" };
      await controller.createTemplate("e1", body, mockRequest);
      expect(templatesService.create).toHaveBeenCalledWith(
        "tenant_id",
        "e1",
        expect.objectContaining({ name: "T1" }),
      );
    });

    it("should update template", async () => {
      const body = { name: "T2" };
      await controller.updateTemplate("t1", body, mockRequest);
      expect(templatesService.update).toHaveBeenCalledWith(
        "tenant_id",
        "t1",
        body,
      );
    });

    it("should upload background", async () => {
      const file = { buffer: Buffer.from("img"), mimetype: "image/png" } as any;
      await controller.uploadTemplateBackground("t1", file, mockRequest);
      expect(templatesService.uploadBackground).toHaveBeenCalled();
    });

    it("should throw error if no file in background upload", async () => {
      await expect(
        controller.uploadTemplateBackground("t1", undefined, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("Preview", () => {
    it("should return PDF stream", async () => {
      const res = {
        set: jest.fn(),
        end: jest.fn(),
      } as any;
      mockPdfService.generatePreview.mockResolvedValue(Buffer.from("pdf"));

      await controller.previewTemplate(
        { backgroundUrl: "url", layoutConfig: {} },
        res,
      );

      expect(res.set).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalledWith(Buffer.from("pdf"));
    });
  });

  describe("Issuance", () => {
    it("should issue bulk certificates", async () => {
      mockTemplatesService.findOne.mockResolvedValue({
        id: "t1",
        eventId: "e1",
      });
      (mockPrismaService.registration.findMany as jest.Mock).mockResolvedValue([
        { id: "reg1", user: { email: "u1@t.com" } },
      ]);
      mockPdfService.generateAndStore.mockResolvedValue({ fileUrl: "url1" });

      const result = await controller.issueBulk(
        "t1",
        { sendEmail: true },
        mockRequest,
      );

      expect(result.total).toBe(1);
      expect(mockMailService.enqueue).toHaveBeenCalled();
    });

    it("should issue single certificate", async () => {
      mockPdfService.generateAndStore.mockResolvedValue({
        fileUrl: "url1",
        issuedId: "i1",
      });
      (
        mockPrismaService.registration.findUnique as jest.Mock
      ).mockResolvedValue({ user: { email: "u1@t.com" } });

      const result = await controller.issueCertificate({
        templateId: "t1",
        registrationId: "reg1",
        sendEmail: true,
      });

      expect(result.issuedId).toBe("i1");
      expect(mockMailService.enqueue).toHaveBeenCalled();
    });
  });

  describe("My Certificates", () => {
    it("should list my certificates", async () => {
      await controller.listMyCertificates(mockRequest);
      expect(mockPrismaService.issuedCertificate.findMany).toHaveBeenCalled();
    });
  });

  describe("Validation", () => {
    it("should validate certificate", async () => {
      (
        mockPrismaService.issuedCertificate.findUnique as jest.Mock
      ).mockResolvedValue({
        validationHash: "hash1",
        registration: { user: { name: "U1" } },
        template: { event: { name: "E1" } },
      });

      const result = await controller.validateCertificate("hash1");
      expect(result.isValid).toBe(true);
    });

    it("should throw NotFound if hash invalid", async () => {
      (
        mockPrismaService.issuedCertificate.findUnique as jest.Mock
      ).mockResolvedValue(null);
      await expect(controller.validateCertificate("bad")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
