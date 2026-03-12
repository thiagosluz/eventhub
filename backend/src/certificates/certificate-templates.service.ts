import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../storage/minio.service';

@Injectable()
export class CertificateTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async listByEvent(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) throw new ForbiddenException('Evento não pertence a este tenant.');
    return this.prisma.certificateTemplate.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, eventId: string, data: { name: string; backgroundUrl: string; layoutConfig: object }) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) throw new ForbiddenException('Evento não pertence a este tenant.');
    return this.prisma.certificateTemplate.create({
      data: {
        eventId,
        name: data.name,
        backgroundUrl: data.backgroundUrl,
        layoutConfig: data.layoutConfig as object,
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const template = await this.prisma.certificateTemplate.findFirst({
      where: { id, event: { tenantId } },
    });
    if (!template) throw new NotFoundException('Template não encontrado.');
    return template;
  }

  async update(tenantId: string, id: string, data: { name?: string; backgroundUrl?: string; layoutConfig?: object }) {
    await this.findOne(tenantId, id);
    return this.prisma.certificateTemplate.update({
      where: { id },
      data: {
        name: data.name,
        backgroundUrl: data.backgroundUrl,
        layoutConfig: data.layoutConfig as object | undefined,
      },
    });
  }

  async uploadBackground(tenantId: string, templateId: string, file: { buffer: Buffer; mimetype: string }) {
    await this.findOne(tenantId, templateId);
    const objectName = `certificate-templates/${templateId}/background-${Date.now()}`;
    const url = await this.minio.uploadObject({
      bucket: 'event-media',
      objectName,
      data: file.buffer,
      contentType: file.mimetype,
    });
    return this.prisma.certificateTemplate.update({
      where: { id: templateId },
      data: { backgroundUrl: url },
    });
  }
}
