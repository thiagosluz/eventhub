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
import { MonitorGuard } from "../auth/monitor.guard";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly gamificationService: GamificationService,
    private readonly badgesService: BadgesService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events/:id")
  async getEventAnalytics(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant missing from request.");
    }
    return this.analyticsService.getEventAnalytics(tenantId, id);
  }

  @UseGuards(MonitorGuard)
  @Get("events/:id/participants")
  async getEventParticipants(
    @Param("id") id: string,
    @Query("search") search: string,
    @Query("limit") limit: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant missing from request.");
    }
    return this.analyticsService.getEventParticipants(
      tenantId,
      id,
      search,
      limit ? parseInt(limit) : undefined,
    );
  }

  @UseGuards(MonitorGuard)
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

  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/gamification/stats")
  async getStats(@Param("id") eventId: string) {
    return this.gamificationService.getEventStats(eventId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/gamification/ranking")
  async getRanking(@Param("id") eventId: string) {
    return this.gamificationService.getEventRanking(eventId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/gamification/alerts")
  async getAlerts(@Param("id") eventId: string) {
    return this.gamificationService.getEventAlerts(eventId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch("gamification/alerts/:id/resolve")
  async resolveAlert(@Param("id") alertId: string) {
    return this.gamificationService.resolveAlert(alertId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/gamification/badges-history")
  async getBadgesHistory(
    @Param("id") eventId: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new ForbiddenException("Tenant ID missing");
    return this.badgesService.getAwardedHistory(tenantId, eventId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Delete("gamification/badges/:userBadgeId/revoke")
  async revokeBadge(
    @Param("userBadgeId") userBadgeId: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new ForbiddenException("Tenant ID missing");
    return this.badgesService.revokeBadge(tenantId, userBadgeId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/feedbacks")
  async getEventFeedbacks(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Query("activityId") activityId?: string,
    @Query("speakerId") speakerId?: string,
    @Query("rating") rating?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new ForbiddenException("Tenant ID missing");
    return this.analyticsService.getEventFeedbacks(tenantId, id, {
      activityId,
      speakerId,
      rating: rating ? parseInt(rating) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/feedback-highlights")
  async getEventFeedbackHighlights(
    @Param("id") id: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new ForbiddenException("Tenant ID missing");
    return this.analyticsService.getEventFeedbackHighlights(tenantId, id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events/:id/speakers")
  async getEventSpeakers(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new ForbiddenException("Tenant ID missing");
    return this.analyticsService.getEventSpeakers(tenantId, id);
  }
}
