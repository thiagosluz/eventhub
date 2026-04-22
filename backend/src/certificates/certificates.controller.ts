import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  Delete,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  NotFoundException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { imageUploadConfig } from "../common/upload/upload.config";
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
    body: {
      name: string;
      backgroundUrl: string;
      category?: string;
      layoutConfig?: object;
    },
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");
    return this.certificateTemplates.create(tenantId, eventId, {
      name: body.name,
      backgroundUrl: body.backgroundUrl,
      category: body.category as any,
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
    body: {
      name?: string;
      backgroundUrl?: string;
      category?: string;
      layoutConfig?: object;
    },
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");
    return this.certificateTemplates.update(tenantId, id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("templates/:id/background")
  @UseInterceptors(FileInterceptor("file", imageUploadConfig))
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
  async deleteTemplate(
    @Param("id") id: string,
    @Req() req: AuthRequest,
    @Query("force") force?: string,
    @Query("confirm") confirm?: string,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");
    return this.certificateTemplates.delete(
      tenantId,
      id,
      force === "true",
      confirm,
    );
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
    @Body() body: { sendEmail?: boolean; strategy?: "skip" | "overwrite" } = {},
    @Req() req: AuthRequest,
  ) {
    body = body || {};
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId on token payload.");

    const template = await this.certificateTemplates.findOne(
      tenantId,
      templateId,
    );

    const results = [];
    if ((template as any).category === "PARTICIPANT") {
      const registrations = await this.prisma.registration.findMany({
        where: { eventId: template.eventId },
        include: { user: true },
      });

      for (const reg of registrations) {
        try {
          const { fileUrl } = await this.certificatePdf.generateAndStore(
            templateId,
            { registrationId: reg.id, userId: reg.userId },
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
    } else if ((template as any).category === "SPEAKER") {
      const activities = await this.prisma.activity.findMany({
        where: { eventId: template.eventId },
        include: {
          speakers: { include: { speaker: { include: { user: true } } } },
        },
      });

      for (const activity of activities) {
        for (const actSpeaker of activity.speakers) {
          try {
            const { fileUrl } = await this.certificatePdf.generateAndStore(
              templateId,
              {
                userId: actSpeaker.speaker.userId || undefined,
                activityId: activity.id,
              },
              body.strategy || "skip",
            );

            const email =
              actSpeaker.speaker.user?.email || actSpeaker.speaker.email;
            if (body.sendEmail && email) {
              await this.mail.enqueue({
                to: email,
                subject: "Seu certificado de palestrante está pronto",
                text: `Acesse seu certificado em: ${fileUrl}`,
                html: `<p>Acesse seu certificado em: <a href="${fileUrl}">${fileUrl}</a></p>`,
              });
            }
            results.push({
              speakerId: actSpeaker.speakerId,
              status: "success",
              fileUrl,
            });
          } catch (error: any) {
            results.push({
              speakerId: actSpeaker.speakerId,
              status: "error",
              error: error.message,
            });
          }
        }
      }
    } else if ((template as any).category === "REVIEWER") {
      const reviewers = await this.prisma.user.findMany({
        where: {
          reviews: {
            some: {
              submission: { eventId: template.eventId },
            },
          },
        },
      });

      for (const reviewer of reviewers) {
        try {
          const { fileUrl } = await this.certificatePdf.generateAndStore(
            templateId,
            { userId: reviewer.id },
            body.strategy || "skip",
          );

          if (body.sendEmail && reviewer.email) {
            await this.mail.enqueue({
              to: reviewer.email,
              subject: "Seu certificado de revisor científico está pronto",
              text: `Acesse seu certificado em: ${fileUrl}`,
              html: `<p>Acesse seu certificado em: <a href="${fileUrl}">${fileUrl}</a></p>`,
            });
          }
          results.push({ reviewerId: reviewer.id, status: "success", fileUrl });
        } catch (error: any) {
          results.push({
            reviewerId: reviewer.id,
            status: "error",
            error: error.message,
          });
        }
      }
    } else if ((template as any).category === "MONITOR") {
      const monitors = await this.prisma.eventMonitor.findMany({
        where: { eventId: template.eventId },
        include: { user: true },
      });

      for (const monitor of monitors) {
        try {
          const { fileUrl } = await this.certificatePdf.generateAndStore(
            templateId,
            { userId: monitor.userId },
            body.strategy || "skip",
          );

          if (body.sendEmail && monitor.user.email) {
            await this.mail.enqueue({
              to: monitor.user.email,
              subject: "Seu certificado de monitoria está pronto",
              text: `Acesse seu certificado em: ${fileUrl}`,
              html: `<p>Acesse seu certificado em: <a href="${fileUrl}">${fileUrl}</a></p>`,
            });
          }
          results.push({
            monitorId: monitor.userId,
            status: "success",
            fileUrl,
          });
        } catch (error: any) {
          results.push({
            monitorId: monitor.userId,
            status: "error",
            error: error.message,
          });
        }
      }
    }

    return {
      total: results.length,
      processed: results.filter((r) => r.status === "success").length,
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
      registrationId?: string;
      userId?: string;
      activityId?: string;
      sendEmail?: boolean;
    },
  ) {
    const { fileUrl, issuedId } = await this.certificatePdf.generateAndStore(
      body.templateId,
      {
        registrationId: body.registrationId,
        userId: body.userId,
        activityId: body.activityId,
      },
    );

    if (body.sendEmail) {
      // Resolve email
      let email: string | undefined;
      if (body.registrationId) {
        const reg = await this.prisma.registration.findUnique({
          where: { id: body.registrationId },
          include: { user: true },
        });
        email = reg?.user?.email;
      } else if (body.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: body.userId },
        });
        email = user?.email;
      }

      if (email) {
        await this.mail.enqueue({
          to: email,
          subject: "Seu certificado está pronto",
          text: `Acesse seu certificado em: ${fileUrl}`,
          html: `<p>Acesse seu certificado em: <a href="${fileUrl}">${fileUrl}</a></p>`,
        });
      }
    }

    return { fileUrl, issuedId };
  }

  @UseGuards(JwtAuthGuard)
  @Get("my")
  async listMyCertificates(@Req() req: AuthRequest) {
    const userId = req.user?.sub;
    if (!userId) throw new Error("Missing userId on token payload.");

    return this.prisma.issuedCertificate.findMany({
      where: {
        OR: [{ userId }, { registration: { userId } }],
      } as any,
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
        activity: {
          select: {
            title: true,
            type: { select: { name: true } },
          },
        },
      } as any,
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
        user: true,
        activity: { include: { type: true } },
        template: {
          include: { event: true },
        },
      } as any,
    });

    if (!certificate) {
      throw new NotFoundException("Certificado inválido ou não encontrado.");
    }

    const participantName =
      (certificate as any).user?.name ||
      (certificate as any).registration?.user?.name ||
      "N/A";

    return {
      isValid: true,
      hash: certificate.validationHash,
      issuedAt: certificate.issuedAt,
      fileUrl: certificate.fileUrl,
      participantName,
      eventName: (certificate as any).template.event.name,
      category: (certificate as any).template.category,
      activityTitle: (certificate as any).activity?.title,
    };
  }
}
