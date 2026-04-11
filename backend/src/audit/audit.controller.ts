import { Controller, Get, Param, UseGuards, Header } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../auth/roles.types";

@Controller("events/:eventId/audit")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ORGANIZER)
  async getAuditLogs(@Param("eventId") eventId: string) {
    return this.auditService.findByEvent(eventId);
  }

  @Get("export")
  @Roles(UserRole.ORGANIZER)
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", "attachment; filename=audit-logs.csv")
  async exportAuditLogs(@Param("eventId") eventId: string) {
    return this.auditService.exportToCsv(eventId);
  }
}
