import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

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
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    };
  }) {
    const { tenantId, data } = params;

    const existing = await this.prisma.event.findFirst({
      where: { tenantId, slug: data.slug },
    });

    if (existing) {
      throw new Error(
        "Já existe um evento com este slug para a sua organização.",
      );
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("As datas de início e término devem ser válidas.");
    }

    return this.prisma.event.create({
      data: {
        tenantId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        location: data.location,
        startDate: start,
        endDate: end,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        themeConfig: data.themeConfig as unknown as object | undefined,
        status: data.status ?? "DRAFT",
      },
    });
  }

  async listEventsForTenant(tenantId: string) {
    return this.prisma.event.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findEventById(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      include: {
        activities: { orderBy: { startAt: "asc" } },
      },
    });
    if (!event) {
      throw new NotFoundException("Evento não encontrado para este tenant.");
    }
    return event;
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
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    };
  }) {
    const { tenantId, eventId, data } = params;

    const existing = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Evento não encontrado para este tenant.");
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        location: data.location,
        startDate: data.startDate
          ? isNaN(new Date(data.startDate).getTime())
            ? (() => {
                throw new Error("Data de início inválida");
              })()
            : new Date(data.startDate)
          : undefined,
        endDate: data.endDate
          ? isNaN(new Date(data.endDate).getTime())
            ? (() => {
                throw new Error("Data de término inválida");
              })()
            : new Date(data.endDate)
          : undefined,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        themeConfig: data.themeConfig as unknown as object | undefined,
        bannerUrl: data.bannerUrl,
        logoUrl: data.logoUrl,
        status: data.status,
      },
    });
  }

  async findAllPublic() {
    return this.prisma.event.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { startDate: "asc" },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            themeConfig: true,
          },
        },
      },
    });
  }

  async findPublicBySlug(slug: string, organizerTenantId?: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        slug,
        OR: [
          { status: "PUBLISHED" },
          ...(organizerTenantId ? [{ tenantId: organizerTenantId }] : []),
        ],
      },
      include: {
        activities: { orderBy: { startAt: "asc" } },
        tenant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            themeConfig: true,
          },
        } as any,
        forms: {
          where: { type: "REGISTRATION" },
          include: {
            fields: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException("Evento não encontrado.");
    }

    return event;
  }

  async listParticipants(tenantId: string, filters: any) {
    const { eventId, search, status } = filters;

    return this.prisma.registration.findMany({
      where: {
        event: {
          tenantId,
          ...(eventId ? { id: eventId } : {}),
        },
        ...(status ? { status } : {}),
        ...(search
          ? {
              user: {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { name: true } },
        tickets: { select: { type: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
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
        createdAt: "desc",
      },
    });
  }

  async findParticipantDetail(tenantId: string, registrationId: string) {
    const reg = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, name: true, tenantId: true } },
        tickets: true,
        enrollments: {
          include: {
            activity: {
              include: { type: true },
            },
          },
        },
        formResponses: {
          include: {
            form: { select: { name: true } },
            answers: {
              include: { field: true },
            },
          },
        },
        certificates: {
          include: {
            template: { select: { name: true } },
          },
        },
      },
    });

    if (!reg || reg.event.tenantId !== tenantId) {
      throw new NotFoundException("Inscrição não encontrada.");
    }

    // Get history for the same user in the same tenant
    const history = await this.prisma.registration.findMany({
      where: {
        userId: reg.userId,
        event: { tenantId },
        id: { not: registrationId },
      },
      include: {
        event: { select: { name: true, startDate: true } },
        tickets: { select: { type: true, status: true } },
        certificates: { select: { id: true, issuedAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      ...reg,
      history,
    };
  }
}
