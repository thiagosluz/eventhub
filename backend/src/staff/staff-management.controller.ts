import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { StaffManagementService } from "./staff-management.service";
import { CreateOrganizerDto } from "./dto/create-organizer.dto";
import { AssignMonitorDto } from "./dto/assign-monitor.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../auth/roles.types";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Staff Management")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("staff")
export class StaffManagementController {
  constructor(private readonly staffService: StaffManagementService) {}

  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: "Create a new organizer for the organization" })
  @Post("organizers")
  async createOrganizer(@Request() req: any, @Body() data: CreateOrganizerDto) {
    return this.staffService.createOrganizer(req.user.tenantId, data);
  }

  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: "List all organizers of the organization" })
  @Get("organizers")
  async listOrganizers(@Request() req: any) {
    return this.staffService.listOrganizers(req.user.tenantId);
  }

  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: "Assign a monitor to an event" })
  @Post("events/:eventId/monitors")
  async assignMonitor(
    @Param("eventId") eventId: string,
    @Body() data: AssignMonitorDto,
  ) {
    return this.staffService.assignMonitor(eventId, data.userId);
  }

  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: "Remove a monitor from an event" })
  @Delete("events/:eventId/monitors/:userId")
  async removeMonitor(
    @Param("eventId") eventId: string,
    @Param("userId") userId: string,
  ) {
    return this.staffService.removeMonitor(eventId, userId);
  }

  @Roles(UserRole.ORGANIZER)
  @ApiOperation({ summary: "List all monitors of an event" })
  @Get("events/:eventId/monitors")
  async listMonitors(@Param("eventId") eventId: string) {
    return this.staffService.listMonitors(eventId);
  }

  @Roles(UserRole.ORGANIZER)
  @ApiOperation({
    summary: "List all participants of an event (potential monitors)",
  })
  @Get("events/:eventId/potential-monitors")
  async listPotentialMonitors(@Param("eventId") eventId: string) {
    const registrations =
      await this.staffService.listEventParticipants(eventId);
    return registrations.map((r) => r.user);
  }
}
