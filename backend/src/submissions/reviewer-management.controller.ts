import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/roles.types";
import { ReviewerManagementService } from "./reviewer-management.service";
import { InviteReviewerDto } from "./dto/invite-reviewer.dto";
import { ManualRegisterReviewerDto } from "./dto/manual-register-reviewer.dto";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@Controller()
export class ReviewerManagementController {
  constructor(private readonly reviewerManagement: ReviewerManagementService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("events/:eventId/reviewer-invitations")
  async inviteReviewer(
    @Param("eventId") eventId: string,
    @Body() body: InviteReviewerDto,
    @Req() req: AuthRequest,
  ) {
    const invitedById = req.user?.sub;
    if (!invitedById) throw new Error("Missing user id");
    return this.reviewerManagement.inviteReviewer(eventId, body.email, invitedById);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("events/:eventId/reviewers/manual")
  async manualRegister(
    @Param("eventId") eventId: string,
    @Body() body: ManualRegisterReviewerDto,
  ) {
    return this.reviewerManagement.manualRegister(eventId, body);
  }

  @Get("reviewer-invitations/:token")
  async getInvitation(@Param("token") token: string) {
    return this.reviewerManagement.getInvitation(token);
  }

  @Post("reviewer-invitations/accept")
  async acceptInvitation(@Body() body: AcceptInvitationDto) {
    return this.reviewerManagement.acceptInvitation(body);
  }
}
