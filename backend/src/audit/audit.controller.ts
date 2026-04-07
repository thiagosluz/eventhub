import { Controller, Get, Param, UseGuards } from "@nestjs/common";
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
  @Roles(UserRole.ORGANIZER) // Only organizers can see the audit log
  async getAuditLogs(@Param("eventId") eventId: string) {
    return this.auditService.findByEvent(eventId);
  }
}
