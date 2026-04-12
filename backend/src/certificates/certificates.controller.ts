import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  Delete,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  NotFoundException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request, Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/roles.types";
import { CertificatePdfService } from "./certificate-pdf.service";
import { CertificateTemplatesService } from "./certificate-templates.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";

interface AuthRequest extends Request {
  user?: { sub: string; email: string; tenantId: string; role: string };
}

@Controller("certificates")
export class CertificatesController {
  constructor(
    private readonly certificatePdf: CertificatePdfService,
    private readonly certificateTemplates: CertificateTemplatesService,
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("templates/event/:eventId")
  async listTemplates(
    @Param("eventId") eventId: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");
    return this.certificateTemplates.listByEvent(tenantId, eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("templates/event/:eventId")
  async createTemplate(
    @Param("eventId") eventId: string,
    @Body()
    body: { name: string; backgroundUrl: string; layoutConfig?: object },
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");
    return this.certificateTemplates.create(tenantId, eventId, {
      name: body.name,
      backgroundUrl: body.backgroundUrl,
      layoutConfig: body.layoutConfig ?? { placeholders: [] },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("templates/:id")
  async getTemplate(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");
    return this.certificateTemplates.findOne(tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch("templates/:id")
  async updateTemplate(
    @Param("id") id: string,
    @Body()
    body: { name?: string; backgroundUrl?: string; layoutConfig?: object },
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");
    return this.certificateTemplates.update(tenantId, id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("templates/:id/background")
  @UseInterceptors(FileInterceptor("file"))
  async uploadTemplateBackground(
    @Param("id") id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");
    if (!file?.buffer)
      throw new BadRequestException("Arquivo de imagem é obrigatório.");
    return this.certificateTemplates.uploadBackground(tenantId, id, {
      buffer: file.buffer,
      mimetype: file.mimetype,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Delete("templates/:id")
  async deleteTemplate(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");
    return this.certificateTemplates.delete(tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("templates/:id/duplicate")
  async duplicateTemplate(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");
    return this.certificateTemplates.duplicate(tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("templates/preview")
  async previewTemplate(
    @Body() body: { backgroundUrl: string; layoutConfig: any },
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.certificatePdf.generatePreview({
      backgroundUrl: body.backgroundUrl,
      layoutConfig: body.layoutConfig,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=preview.pdf",
      "Content-Length": pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("templates/:templateId/issue-bulk")
  async issueBulk(
    @Param("templateId") templateId: string,
    @Body() body: { sendEmail?: boolean; strategy?: "skip" | "overwrite" },
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");

    const template = await this.certificateTemplates.findOne(
      tenantId,
      templateId,
    );

    // Find all registrations for this event
    const registrations = await this.prisma.registration.findMany({
      where: { eventId: template.eventId },
      include: { user: true },
    });

    const results = [];
    for (const reg of registrations) {
      try {
        const { fileUrl } = await this.certificatePdf.generateAndStore(
          templateId,
          reg.id,
          body.strategy || "skip",
        );

        if (body.sendEmail && reg.user.email) {
          await this.mail.enqueue({
            to: reg.user.email,
            subject: "Seu certificado está pronto",
            text: `Acesse seu certificado em: ${fileUrl}`,
            html: `<p>Acesse seu certificado em: <a href="${fileUrl}">${fileUrl}</a></p>`,
          });
        }
        results.push({ registrationId: reg.id, status: "success", fileUrl });
      } catch (error: any) {
        results.push({
          registrationId: reg.id,
          status: "error",
          error: error.message,
        });
      }
    }

    const successes = results.filter((r) => r.status === "success");
    return {
      total: registrations.length,
      processed: successes.length,
      failed: registrations.length - successes.length,
      details: results,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("issue")
  async issueCertificate(
    @Body()
    body: {
      templateId: string;
      registrationId: string;
      sendEmail?: boolean;
    },
  ) {
    const { fileUrl, issuedId } = await this.certificatePdf.generateAndStore(
      body.templateId,
      body.registrationId,
    );

    if (body.sendEmail) {
      const reg = await this.prisma.registration.findUnique({
        where: { id: body.registrationId },
        include: { user: true },
      });
      if (reg?.user.email) {
        await this.mail.enqueue({
          to: reg.user.email,
          subject: "Seu certificado está pronto",
          text: `Acesse seu certificado em: ${fileUrl}`,
          html: `<p>Acesse seu certificado em: <a href="${fileUrl}">${fileUrl}</a></p>`,
        });
      }
    }

    return { issuedId, fileUrl };
  }

  @UseGuards(JwtAuthGuard)
  @Get("my")
  async listMyCertificates(@Req() req: AuthRequest) {
    const userId = req.user?.sub;
    if (!userId) throw new Error("Missing userId on token payload.");

    return this.prisma.issuedCertificate.findMany({
      where: {
        registration: { userId },
      },
      include: {
        template: {
          include: {
            event: {
              select: {
                name: true,
                slug: true,
                startDate: true,
              },
            },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });
  }

  @Get("validate/:hash")
  async validateCertificate(@Param("hash") hash: string) {
    const certificate = await this.prisma.issuedCertificate.findUnique({
      where: { validationHash: hash },
      include: {
        registration: {
          include: { user: true, event: true },
        },
        template: {
          include: { event: true },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException("Certificado inválido ou não encontrado.");
    }

    return {
      isValid: true,
      hash: certificate.validationHash,
      issuedAt: certificate.issuedAt,
      fileUrl: certificate.fileUrl,
      participantName: certificate.registration.user.name,
      eventName: certificate.template.event.name,
    };
  }
}
