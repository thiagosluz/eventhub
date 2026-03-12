import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(params: {
    tenantId: string;
    data: {
      name: string;
      slug: string;
      description?: string;
      location?: string;
      startDate: string;
      endDate: string;
      seoTitle?: string;
      seoDescription?: string;
      themeConfig?: Record<string, unknown>;
    };
  }) {
    const { tenantId, data } = params;

    return this.prisma.event.create({
      data: {
        tenantId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        themeConfig: data.themeConfig as unknown as object | undefined,
      },
    });
  }

  async listEventsForTenant(tenantId: string) {
    return this.prisma.event.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateEvent(params: {
    tenantId: string;
    eventId: string;
    data: {
      name?: string;
      slug?: string;
      description?: string;
      location?: string;
      startDate?: string;
      endDate?: string;
      seoTitle?: string;
      seoDescription?: string;
      themeConfig?: Record<string, unknown>;
      bannerUrl?: string;
      logoUrl?: string;
    };
  }) {
    const { tenantId, eventId, data } = params;

    const existing = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Evento não encontrado para este tenant.');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        location: data.location,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        themeConfig: data.themeConfig as unknown as object | undefined,
        bannerUrl: data.bannerUrl,
        logoUrl: data.logoUrl,
      },
    });
  }

  async findPublicBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        activities: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    return event;
  }
}

