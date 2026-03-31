import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MonitorGuard } from "../auth/monitor.guard";
import { AnalyticsService } from "./analytics.service";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@Controller("analytics")
@UseGuards(JwtAuthGuard, MonitorGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("events/:id")
  async getEventAnalytics(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant missing from request.");
    }
    return this.analyticsService.getEventAnalytics(tenantId, id);
  }

  @Get("events/:id/participants")
  async getEventParticipants(@Param("id") id: string, @Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant missing from request.");
    }
    return this.analyticsService.getEventParticipants(tenantId, id);
  }

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
}
