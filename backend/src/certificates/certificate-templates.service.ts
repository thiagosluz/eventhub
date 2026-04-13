import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";

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
    if (!event)
      throw new ForbiddenException("Evento não pertence a este tenant.");
    return this.prisma.certificateTemplate.findMany({
      where: { eventId },
      include: {
        _count: {
          select: { issuedCertificates: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(
    tenantId: string,
    eventId: string,
    data: {
      name: string;
      backgroundUrl: string;
      layoutConfig: object;
      category?: string;
    },
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event)
      throw new ForbiddenException("Evento não pertence a este tenant.");
    return this.prisma.certificateTemplate.create({
      data: {
        eventId,
        name: data.name,
        backgroundUrl: data.backgroundUrl,
        category: (data.category as any) ?? "PARTICIPANT",
        layoutConfig: data.layoutConfig as object,
      } as any,
      include: {
        _count: {
          select: { issuedCertificates: true },
        },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const template = await this.prisma.certificateTemplate.findFirst({
      where: { id, event: { tenantId } },
      include: {
        _count: {
          select: { issuedCertificates: true },
        },
      },
    });
    if (!template) throw new NotFoundException("Template não encontrado.");
    return template;
  }

  async update(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      backgroundUrl?: string;
      layoutConfig?: object;
      category?: string;
    },
  ) {
    await this.findOne(tenantId, id);
    return this.prisma.certificateTemplate.update({
      where: { id },
      data: {
        name: data.name,
        backgroundUrl: data.backgroundUrl,
        category: data.category as any,
        layoutConfig: data.layoutConfig as object | undefined,
      } as any,
      include: {
        _count: {
          select: { issuedCertificates: true },
        },
      },
    });
  }

  async uploadBackground(
    tenantId: string,
    templateId: string,
    file: { buffer: Buffer; mimetype: string },
  ) {
    await this.findOne(tenantId, templateId);
    const objectName = `certificate-templates/${templateId}/background-${Date.now()}`;
    const url = await this.minio.uploadObject({
      bucket: "event-media",
      objectName,
      data: file.buffer,
      contentType: file.mimetype,
    });
    return this.prisma.certificateTemplate.update({
      where: { id: templateId },
      data: { backgroundUrl: url },
    });
  }

  async delete(tenantId: string, id: string, force = false, confirm?: string) {
    console.log(
      `[Certificates] Tentativa de deleção: ID=${id}, Force=${force}, Confirm=${confirm}`,
    );

    const template = await this.prisma.certificateTemplate.findFirst({
      where: { id, event: { tenantId } },
      include: {
        _count: {
          select: { issuedCertificates: true },
        },
      },
    });

    if (!template) throw new NotFoundException("Template não encontrado.");

    if (template._count.issuedCertificates > 0 && !force) {
      throw new ConflictException(
        "Não é possível excluir um template que já possui certificados emitidos.",
      );
    }

    if (force && confirm?.trim() !== "DELETAR") {
      throw new ConflictException(
        "Para excluir um template com certificados, você deve digitar a palavra de segurança 'DELETAR'.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Se for forçado, deleta os certificados primeiro
      if (force) {
        await tx.issuedCertificate.deleteMany({
          where: { templateId: id },
        });
      }

      return tx.certificateTemplate.delete({
        where: { id },
      });
    });
  }

  async duplicate(tenantId: string, id: string) {
    const original = await this.findOne(tenantId, id);

    return this.prisma.certificateTemplate.create({
      data: {
        eventId: original.eventId,
        name: `${original.name} (Cópia)`,
        backgroundUrl: original.backgroundUrl,
        layoutConfig: original.layoutConfig as object,
      },
      include: {
        _count: {
          select: { issuedCertificates: true },
        },
      },
    });
  }
}
