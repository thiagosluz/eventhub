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
    tenantId?: string;
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
        tenantId: data.tenantId,
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

  async exportToCsv(eventId: string): Promise<string> {
    const logs = await this.findByEvent(eventId);

    const header = "Data,Usuario,Email,Acao,Recurso,IP\n";
    const rows = logs
      .map((log) => {
        const date = new Date(log.createdAt);
        const brDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

        return [
          brDate,
          `"${log.user.name}"`,
          log.user.email,
          log.action,
          log.resource,
          log.ip || "N/A",
        ].join(",");
      })
      .join("\n");

    // Return with UTF-8 BOM for Excel compatibility
    return "\ufeff" + header + rows;
  }
}
