import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";

@Injectable()
export class SubmissionConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async getConfig(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      select: {
        id: true,
        submissionsEnabled: true,
        submissionStartDate: true,
        submissionEndDate: true,
        reviewStartDate: true,
        reviewEndDate: true,
        scientificCommitteeHead: true,
        scientificCommitteeEmail: true,
        submissionModalities: {
          orderBy: { createdAt: "asc" },
        },
        thematicAreas: {
          orderBy: { createdAt: "asc" },
        },
        submissionRules: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!event) {
      throw new NotFoundException("Evento não encontrado para este tenant.");
    }

    return event;
  }

  async updateConfig(
    tenantId: string,
    eventId: string,
    data: {
      submissionsEnabled?: boolean;
      submissionStartDate?: string;
      submissionEndDate?: string;
      reviewStartDate?: string;
      reviewEndDate?: string;
      scientificCommitteeHead?: string;
      scientificCommitteeEmail?: string;
    },
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new NotFoundException("Evento não encontrado para este tenant.");
    }

    const parseDate = (val?: string) =>
      val ? new Date(val) : undefined;

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        submissionsEnabled: data.submissionsEnabled,
        submissionStartDate: parseDate(data.submissionStartDate),
        submissionEndDate: parseDate(data.submissionEndDate),
        reviewStartDate: parseDate(data.reviewStartDate),
        reviewEndDate: parseDate(data.reviewEndDate),
        scientificCommitteeHead: data.scientificCommitteeHead,
        scientificCommitteeEmail: data.scientificCommitteeEmail,
      },
    });
  }

  // === Modalities ===

  async createModality(
    tenantId: string,
    eventId: string,
    data: { name: string; description?: string },
    templateFile?: { buffer: Buffer; mimetype: string },
  ) {
    await this.ensureEventOwnership(tenantId, eventId);

    let templateUrl: string | undefined;
    if (templateFile) {
      const objectName = `events/${eventId}/templates/${Date.now()}`;
      templateUrl = await this.minio.uploadObject({
        bucket: "submissions",
        objectName,
        data: templateFile.buffer,
        contentType: templateFile.mimetype,
      });
    }

    return this.prisma.submissionModality.create({
      data: {
        eventId,
        name: data.name,
        description: data.description,
        templateUrl,
      },
    });
  }

  async deleteModality(tenantId: string, eventId: string, modalityId: string) {
    await this.ensureEventOwnership(tenantId, eventId);

    const modality = await this.prisma.submissionModality.findFirst({
      where: { id: modalityId, eventId },
    });

    if (!modality) {
      throw new NotFoundException("Modalidade não encontrada.");
    }

    return this.prisma.submissionModality.delete({
      where: { id: modalityId },
    });
  }

  // === Thematic Areas ===

  async createThematicArea(
    tenantId: string,
    eventId: string,
    data: { name: string },
  ) {
    await this.ensureEventOwnership(tenantId, eventId);

    return this.prisma.thematicArea.create({
      data: {
        eventId,
        name: data.name,
      },
    });
  }

  async deleteThematicArea(
    tenantId: string,
    eventId: string,
    areaId: string,
  ) {
    await this.ensureEventOwnership(tenantId, eventId);

    const area = await this.prisma.thematicArea.findFirst({
      where: { id: areaId, eventId },
    });

    if (!area) {
      throw new NotFoundException("Área temática não encontrada.");
    }

    return this.prisma.thematicArea.delete({
      where: { id: areaId },
    });
  }

  // === Submission Rules ===

  async createRule(
    tenantId: string,
    eventId: string,
    data: { title: string },
    file: { buffer: Buffer; mimetype: string },
  ) {
    await this.ensureEventOwnership(tenantId, eventId);

    const objectName = `events/${eventId}/rules/${Date.now()}`;
    const fileUrl = await this.minio.uploadObject({
      bucket: "submissions",
      objectName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    return this.prisma.submissionRule.create({
      data: {
        eventId,
        title: data.title,
        fileUrl,
      },
    });
  }

  async deleteRule(tenantId: string, eventId: string, ruleId: string) {
    await this.ensureEventOwnership(tenantId, eventId);

    const rule = await this.prisma.submissionRule.findFirst({
      where: { id: ruleId, eventId },
    });

    if (!rule) {
      throw new NotFoundException("Regra não encontrada.");
    }

    return this.prisma.submissionRule.delete({
      where: { id: ruleId },
    });
  }

  // === Helper ===

  private async ensureEventOwnership(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new ForbiddenException("Evento não pertence a este tenant.");
    }

    return event;
  }
}
