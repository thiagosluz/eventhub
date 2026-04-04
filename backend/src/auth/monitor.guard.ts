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
    const eventId = params.eventId || params.id;

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
    });

    if (!monitor) {
      throw new ForbiddenException(
        "Você não tem permissão de monitor para este evento.",
      );
    }

    return true;
  }
}
