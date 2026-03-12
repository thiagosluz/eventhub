import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/roles.types';
import { CertificatePdfService } from './certificate-pdf.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class CertificatesController {
  constructor(
    private readonly certificatePdf: CertificatePdfService,
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
  ) {}

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
