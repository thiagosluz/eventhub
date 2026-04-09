import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("User is not authenticated");
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        "Only Super Admins can access this resource.",
      );
    }

    return true;
  }
}
