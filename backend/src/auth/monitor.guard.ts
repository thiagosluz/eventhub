import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "./roles.types";

@Injectable()
export class MonitorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;

    if (!user) {
      return false;
    }

    // Role-based logic
    if (user.role === UserRole.ORGANIZER) {
      return true;
    }

    // Try to find eventId in params
    let eventId = params.eventId || params.id;

    // Support resolution from boardId or taskId
    if (!eventId && params.boardId) {
      const board = await this.prisma.kanbanBoard.findUnique({
        where: { id: params.boardId },
        select: { eventId: true },
      });
      eventId = board?.eventId;
    }

    if (!eventId && params.taskId) {
      const task = await this.prisma.kanbanTask.findUnique({
        where: { id: params.taskId },
        select: {
          column: {
            select: {
              board: {
                select: { eventId: true },
              },
            },
          },
        },
      });
      eventId = task?.column?.board?.eventId;
    }

    if (!eventId) {
      // If we are protectively applying this to an endpoint without event context,
      // and user is NOT organizer, we block.
      return false;
    }

    // Check if user is a monitor for this specific event
    const monitor = await this.prisma.eventMonitor.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.sub,
        },
      },
      include: {
        event: {
          select: { tenantId: true },
        },
      },
    });

    if (!monitor) {
      throw new ForbiddenException(
        "Você não tem permissão de monitor para este evento.",
      );
    }

    // Tenant Isolation Check
    // If the user has a tenantId (staff member), it MUST match the event's tenantId.
    if (user.tenantId && monitor.event.tenantId !== user.tenantId) {
      throw new ForbiddenException(
        "Acesso negado: Este evento pertence a outro inquilino.",
      );
    }

    return true;
  }
}
