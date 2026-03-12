import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/roles.types';
import { CertificatePdfService } from './certificate-pdf.service';
import { CertificateTemplatesService } from './certificate-templates.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

interface AuthRequest extends Request {
  user?: { sub: string; email: string; tenantId: string; role: string };
}

@Controller()
export class CertificatesController {
  constructor(
    private readonly certificatePdf: CertificatePdfService,
    private readonly certificateTemplates: CertificateTemplatesService,
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get('events/:eventId/certificate-templates')
  async listTemplates(@Param('eventId') eventId: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error('Missing tenantId on token payload.');
    return this.certificateTemplates.listByEvent(tenantId, eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post('events/:eventId/certificate-templates')
  async createTemplate(
    @Param('eventId') eventId: string,
    @Body() body: { name: string; backgroundUrl: string; layoutConfig?: object },
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error('Missing tenantId on token payload.');
    return this.certificateTemplates.create(tenantId, eventId, {
      name: body.name,
      backgroundUrl: body.backgroundUrl,
      layoutConfig: body.layoutConfig ?? { placeholders: [] },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get('certificate-templates/:id')
  async getTemplate(@Param('id') id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error('Missing tenantId on token payload.');
    return this.certificateTemplates.findOne(tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch('certificate-templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() body: { name?: string; backgroundUrl?: string; layoutConfig?: object },
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error('Missing tenantId on token payload.');
    return this.certificateTemplates.update(tenantId, id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post('certificate-templates/:id/background')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTemplateBackground(
    @Param('id') id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error('Missing tenantId on token payload.');
    if (!file?.buffer) throw new BadRequestException('Arquivo de imagem é obrigatório.');
    return this.certificateTemplates.uploadBackground(tenantId, id, { buffer: file.buffer, mimetype: file.mimetype });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post('certificates/issue')
  async issueCertificate(
    @Body() body: { templateId: string; registrationId: string; sendEmail?: boolean },
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
          subject: 'Seu certificado está pronto',
          text: `Acesse seu certificado em: ${fileUrl}`,
          html: `<p>Acesse seu certificado em: <a href="${fileUrl}">${fileUrl}</a></p>`,
        });
      }
    }

    return { issuedId, fileUrl };
  }
}
