import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../auth/roles.types";
import { AnalyticsService } from "./analytics.service";
import { GamificationService } from "../gamification/gamification.service";
import { BadgesService } from "../badges/badges.service";
import { Request } from "express";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly gamificationService: GamificationService,
    private readonly badgesService: BadgesService,
  ) {}

  @Roles(UserRole.ORGANIZER)
  @Get("events/:id")
  async getEventAnalytics(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant missing from request.");
    }
    return this.analyticsService.getEventAnalytics(tenantId, id);
  }

  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/participants")
  async getEventParticipants(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant missing from request.");
    }
    return this.analyticsService.getEventParticipants(tenantId, id);
  }

  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/checkins")
  async getEventCheckins(
    @Param("id") id: string,
    @Query("activityId") activityId: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant missing from request.");
    }
    return this.analyticsService.getEventCheckins(tenantId, id, activityId);
  }

  // --- Gamification Endpoints ---

  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/gamification/stats")
  async getStats(@Param("id") eventId: string) {
    return this.gamificationService.getEventStats(eventId);
  }

  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/gamification/ranking")
  async getRanking(@Param("id") eventId: string) {
    return this.gamificationService.getEventRanking(eventId);
  }

  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/gamification/alerts")
  async getAlerts(@Param("id") eventId: string) {
    return this.gamificationService.getEventAlerts(eventId);
  }

  @Roles(UserRole.ORGANIZER)
  @Patch("gamification/alerts/:id/resolve")
  async resolveAlert(@Param("id") alertId: string) {
    return this.gamificationService.resolveAlert(alertId);
  }

  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/gamification/badges-history")
  async getBadgesHistory(@Param("id") eventId: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new ForbiddenException("Tenant ID missing");
    return this.badgesService.getAwardedHistory(tenantId, eventId);
  }

  @Roles(UserRole.ORGANIZER)
  @Delete("gamification/badges/:userBadgeId/revoke")
  async revokeBadge(@Param("userBadgeId") userBadgeId: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new ForbiddenException("Tenant ID missing");
    return this.badgesService.revokeBadge(tenantId, userBadgeId);
  }
}
