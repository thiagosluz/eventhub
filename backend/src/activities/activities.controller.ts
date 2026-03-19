import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/roles.types";
import { ActivitiesService } from "./activities.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@Controller()
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("events/:eventId/activities")
  async createActivity(
    @Param("eventId") eventId: string,
    @Body() body: CreateActivityDto,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    return this.activities.createActivity({
      tenantId,
      eventId,
      data: body,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events/:eventId/activities")
  async listActivitiesForEvent(
    @Param("eventId") eventId: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    return this.activities.listActivitiesForEvent(tenantId, eventId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("activities/my-enrollments/:eventId")
  async getMyEnrollments(
    @Param("eventId") eventId: string,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error("Missing userId on token payload.");
    }

    return this.activities.getActivitiesForParticipant({
      userId,
      eventId,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Patch("activities/:activityId")
  async updateActivity(
    @Param("activityId") activityId: string,
    @Body() body: UpdateActivityDto,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    return this.activities.updateActivity({
      tenantId,
      activityId,
      data: body,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post("activities/:activityId/enroll")
  async enrollInActivity(
    @Param("activityId") activityId: string,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error("Missing user id on token payload.");
    }

    return this.activities.enrollInActivity({
      userId,
      activityId,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Delete("activities/:activityId")
  async deleteActivity(
    @Param("activityId") activityId: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    return this.activities.deleteActivity(tenantId, activityId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("activities/:activityId/unroll")
  async unrollFromActivity(
    @Param("activityId") activityId: string,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error("Missing user id on token payload.");
    }

    return this.activities.unrollFromActivity({
      userId,
      activityId,
    });
  }

  // Activity Types
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("activities/types")
  async createType(@Req() req: AuthRequest, @Body("name") name: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId");
    return this.activities.createType(tenantId, name);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("activities/types")
  async findAllTypes(@Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId");
    return this.activities.findAllTypes(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Delete("activities/types/:id")
  async removeType(@Req() req: AuthRequest, @Param("id") id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId");
    return this.activities.removeType(tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("activities/:activityId/enrollments")
  async listEnrollments(
    @Param("activityId") activityId: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId");
    return this.activities.listEnrollments(tenantId, activityId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("activities/:activityId/enrollments/:enrollmentId/confirm")
  async confirmEnrollment(
    @Param("activityId") activityId: string,
    @Param("enrollmentId") enrollmentId: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error("Missing tenantId");
    return this.activities.confirmEnrollment(
      tenantId,
      activityId,
      enrollmentId,
    );
  }
}
