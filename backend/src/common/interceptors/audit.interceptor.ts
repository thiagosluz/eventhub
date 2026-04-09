import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Reflector } from "@nestjs/core";
import { AuditService } from "../../audit/audit.service";
import { AUDIT_ACTION_KEY } from "../decorators/audit.decorator";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, body, params, user, ip, headers } = request;

    // We only audit mutations (or specific flagged actions)
    const isMutation = ["POST", "PATCH", "PUT", "DELETE"].includes(method);

    // Check for explicit metadata
    const auditMetadata = this.reflector.getAllAndOverride<any>(
      AUDIT_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isMutation && !auditMetadata) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        // We log after success
        if (!user) return; // Anonymous actions are not audited here for now

        // Auto-generate action/resource if not explicitly defined
        const action =
          auditMetadata?.action ||
          `${method}_${context.getClass().name.replace("Controller", "").toUpperCase()}`;
        const resource =
          auditMetadata?.resource ||
          context.getClass().name.replace("Controller", "");
        const resourceId = params?.id || body?.id;

        // More robust eventId extraction
        let eventId = params?.eventId || body?.eventId;

        // If not found and the resource IS Event, then 'id' is our eventId
        if (!eventId && resource === "Event") {
          eventId = params?.id;
        }

        // Clone and sanitize payload (remove sensitive fields)
        const sanitizedPayload = this.sanitize(body);

        this.auditService
          .create({
            userId: user.sub || user.id,
            action,
            resource,
            resourceId,
            eventId,
            payload: sanitizedPayload,
            ip: ip || headers["x-forwarded-for"],
            userAgent: headers["user-agent"],
            tenantId: user.tenantId,
          })
          .catch((err) => {
            console.error("[AuditInterceptor] Failed to save audit log:", err);
          });
      }),
    );
  }

  private sanitize(payload: any): any {
    if (!payload) return null;
    const sanitized = { ...payload };
    const sensitiveFields = ["password", "token", "refreshToken", "secret"];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) sanitized[field] = "********";
    });

    return sanitized;
  }
}
