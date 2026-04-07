import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    eventId?: string;
    payload?: any;
    ip?: string;
    userAgent?: string;
  }) {
    // We run this asynchronously to not block the main request execution
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        eventId: data.eventId,
        payload: data.payload,
        ip: data.ip,
        userAgent: data.userAgent,
      },
    });
  }

  async findByEvent(eventId: string) {
    return this.prisma.auditLog.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
