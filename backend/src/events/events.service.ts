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
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
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
        status: data.status ?? 'DRAFT',
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
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
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
        status: data.status,
      },
    });
  }

  async findPublicBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        activities: { orderBy: { startAt: 'asc' } },
        forms: {
          where: { type: 'REGISTRATION' },
          include: {
            fields: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    return event;
  }

  async findMyTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: {
        registration: {
          userId,
        },
      },
      include: {
        event: {
          select: {
            name: true,
            slug: true,
            startDate: true,
            endDate: true,
            location: true,
            bannerUrl: true,
            logoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

