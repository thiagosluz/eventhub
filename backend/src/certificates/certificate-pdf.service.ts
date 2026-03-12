import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../storage/minio.service';

interface LayoutPlaceholder {
  key: string;
  x: number;
  y: number;
  fontSize?: number;
}

interface LayoutConfig {
  placeholders?: LayoutPlaceholder[];
}

@Injectable()
export class CertificatePdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async generateAndStore(templateId: string, registrationId: string): Promise<{ fileUrl: string; issuedId: string }> {
    const template = await this.prisma.certificateTemplate.findFirst({
      where: { id: templateId },
      include: { event: true },
    });
    if (!template) {
      throw new NotFoundException('Template de certificado não encontrado.');
    }

    const registration = await this.prisma.registration.findFirst({
      where: { id: registrationId, eventId: template.eventId },
      include: { user: true, event: true },
    });
    if (!registration) {
      throw new NotFoundException('Inscrição não encontrada para este evento.');
    }

    const data: Record<string, string> = {
      participantName: registration.user.name,
      eventName: registration.event.name,
      workload: '8h',
    };

    const layout = (template.layoutConfig as LayoutConfig) ?? {};
    const placeholders = layout.placeholders ?? [
      { key: 'participantName', x: 100, y: 280, fontSize: 24 },
      { key: 'eventName', x: 100, y: 340, fontSize: 14 },
      { key: 'workload', x: 100, y: 380, fontSize: 12 },
    ];

    const pdfBuffer = await this.renderPdf(
      template.backgroundUrl,
      placeholders,
      data,
    );

    const objectName = `certificates/${template.eventId}/${registrationId}-${Date.now()}.pdf`;
    const fileUrl = await this.minio.uploadObject({
      bucket: 'certificates',
      objectName,
      data: pdfBuffer,
      contentType: 'application/pdf',
    });

    const issued = await this.prisma.issuedCertificate.create({
      data: {
        templateId: template.id,
        registrationId: registration.id,
        fileUrl,
      },
    });

    return { fileUrl, issuedId: issued.id };
  }

  private async renderPdf(
    backgroundUrl: string,
    placeholders: LayoutPlaceholder[],
    data: Record<string, string>,
  ): Promise<Buffer> {
    const imageBuffer = await this.fetchImage(backgroundUrl);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.image(imageBuffer, 0, 0, { width: doc.page.width, height: doc.page.height });
      doc.fontSize(12);

      for (const p of placeholders) {
        const value = data[p.key] ?? '';
        if (p.fontSize) doc.fontSize(p.fontSize);
        doc.text(value, p.x, p.y);
      }

      doc.end();
    });
  }

  private async fetchImage(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Falha ao carregar imagem do certificado: ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
