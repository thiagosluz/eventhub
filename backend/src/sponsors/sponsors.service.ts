import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateSponsorCategoryDto,
  UpdateSponsorCategoryDto,
} from "./dto/sponsor-category.dto";
import { CreateSponsorDto, UpdateSponsorDto } from "./dto/sponsor.dto";
import { MinioService } from "../storage/minio.service";

@Injectable()
export class SponsorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  // --- Categories ---

  async createCategory(
    tenantId: string,
    eventId: string,
    dto: CreateSponsorCategoryDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) throw new NotFoundException("Evento não encontrado.");

    return this.prisma.sponsorCategory.create({
      data: {
        ...dto,
        eventId,
      },
    });
  }

  async listCategoriesByEvent(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) throw new NotFoundException("Evento não encontrado.");

    return this.prisma.sponsorCategory.findMany({
      where: { eventId },
      orderBy: { displayOrder: "asc" },
      include: { sponsors: { orderBy: { displayOrder: "asc" } } },
    });
  }

  async updateCategory(
    tenantId: string,
    categoryId: string,
    dto: UpdateSponsorCategoryDto,
  ) {
    const category = await this.prisma.sponsorCategory.findUnique({
      where: { id: categoryId },
      include: { event: true },
    });

    if (!category || category.event.tenantId !== tenantId) {
      throw new NotFoundException("Categoria não encontrada.");
    }

    return this.prisma.sponsorCategory.update({
      where: { id: categoryId },
      data: dto,
    });
  }

  async deleteCategory(tenantId: string, categoryId: string) {
    const category = await this.prisma.sponsorCategory.findUnique({
      where: { id: categoryId },
      include: { event: true },
    });

    if (!category || category.event.tenantId !== tenantId) {
      throw new NotFoundException("Categoria não encontrada.");
    }

    return this.prisma.sponsorCategory.delete({
      where: { id: categoryId },
    });
  }

  // --- Sponsors ---

  async createSponsor(tenantId: string, dto: CreateSponsorDto) {
    const category = await this.prisma.sponsorCategory.findUnique({
      where: { id: dto.categoryId },
      include: { event: true },
    });

    if (!category || category.event.tenantId !== tenantId) {
      throw new NotFoundException("Categoria não encontrada.");
    }

    return this.prisma.sponsor.create({
      data: {
        ...dto,
        logoUrl: dto.logoUrl || "", // Provide empty string as fallback if not provided yet
      },
    });
  }

  async updateSponsor(
    tenantId: string,
    sponsorId: string,
    dto: UpdateSponsorDto,
  ) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id: sponsorId },
      include: { category: { include: { event: true } } },
    });

    if (!sponsor || sponsor.category.event.tenantId !== tenantId) {
      throw new NotFoundException("Patrocinador não encontrado.");
    }

    return this.prisma.sponsor.update({
      where: { id: sponsorId },
      data: dto,
    });
  }

  async deleteSponsor(tenantId: string, sponsorId: string) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id: sponsorId },
      include: { category: { include: { event: true } } },
    });

    if (!sponsor || sponsor.category.event.tenantId !== tenantId) {
      throw new NotFoundException("Patrocinador não encontrado.");
    }

    return this.prisma.sponsor.delete({
      where: { id: sponsorId },
    });
  }

  async uploadLogo(
    tenantId: string,
    sponsorId: string,
    file: { buffer: Buffer; mimetype: string },
  ) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id: sponsorId },
      include: { category: { include: { event: true } } },
    });

    if (!sponsor || sponsor.category.event.tenantId !== tenantId) {
      throw new NotFoundException("Patrocinador não encontrado.");
    }

    const objectName = `events/${sponsor.category.eventId}/sponsors/${sponsorId}-${Date.now()}`;
    const url = await this.minio.uploadObject({
      bucket: "event-media",
      objectName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    return this.prisma.sponsor.update({
      where: { id: sponsorId },
      data: { logoUrl: url },
    });
  }

  // --- Public ---

  async listPublicSponsorsByEventSlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug, status: "PUBLISHED" },
    });

    if (!event) throw new NotFoundException("Evento não encontrado.");

    return this.prisma.sponsorCategory.findMany({
      where: { eventId: event.id },
      orderBy: { displayOrder: "asc" },
      include: {
        sponsors: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });
  }
}
