import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "./roles.types";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | { role?: UserRole; isSpeaker?: boolean }
      | undefined;

    if (!user?.role) {
      return false;
    }

    const hasRequiredRole = requiredRoles.includes(user.role);

    // Especial case: allow ORGANIZER access to SPEAKER routes if they have a speaker profile
    const isSpeakerRoute = requiredRoles.includes(UserRole.SPEAKER);
    if (isSpeakerRoute && (user as any).isSpeaker) {
      return true;
    }

    return hasRequiredRole;
  }
}
