import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/roles.types";
import { AddReviewerDto } from "./dto/add-reviewer.dto";
import { AssignReviewDto } from "./dto/assign-review.dto";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { SubmitReviewDto } from "./dto/submit-review.dto";
import { SubmissionsService } from "./submissions.service";

interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

@Controller()
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("submissions")
  @UseInterceptors(FileInterceptor("file"))
  async createSubmission(
    @UploadedFile() file: any,
    @Body() body: CreateSubmissionDto,
    @Req() req: AuthRequest,
  ) {
    const authorId = req.user?.sub;
    if (!authorId) {
      throw new Error("Missing user id on token payload.");
    }

    if (!file) {
      throw new Error("Arquivo de submissão é obrigatório.");
    }

    return this.submissions.createSubmission({
      authorId,
      eventId: body.eventId,
      title: body.title,
      abstract: body.abstract,
      modalityId: body.modalityId,
      thematicAreaId: body.thematicAreaId,
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
      },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events/:eventId/submissions")
  async listSubmissionsForEvent(
    @Param("eventId") eventId: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new Error("Missing tenantId on token payload.");
    }

    return this.submissions.listSubmissionsForEvent(tenantId, eventId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me/reviews")
  async listAssignedToMe(@Req() req: AuthRequest) {
    const reviewerId = req.user?.sub;
    if (!reviewerId) {
      throw new Error("Missing user id on token payload.");
    }

    return this.submissions.listAssignedToReviewer(reviewerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me/submissions")
  async listMySubmissions(@Req() req: AuthRequest) {
    const authorId = req.user?.sub;
    if (!authorId) {
      throw new Error("Missing user id on token payload.");
    }
    return this.submissions.listMySubmissions(authorId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("reviews")
  async submitReview(@Body() body: SubmitReviewDto, @Req() req: AuthRequest) {
    const reviewerId = req.user?.sub;
    if (!reviewerId) {
      throw new Error("Missing user id on token payload.");
    }

    return this.submissions.submitReview({
      reviewerId,
      submissionId: body.submissionId,
      score: body.score,
      recommendation: body.recommendation,
      comments: body.comments,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Get("events/:eventId/reviewers")
  async listEventReviewers(@Param("eventId") eventId: string) {
    return this.submissions.listEventReviewers(eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("events/:eventId/reviewers")
  async addReviewerToEvent(
    @Param("eventId") eventId: string,
    @Body() body: AddReviewerDto,
  ) {
    return this.submissions.addReviewerToEvent(eventId, body.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Delete("events/:eventId/reviewers/:userId")
  async removeReviewerFromEvent(
    @Param("eventId") eventId: string,
    @Param("userId") userId: string,
  ) {
    return this.submissions.removeReviewerFromEvent(eventId, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Post("reviews/manual")
  async manualAssignReview(@Body() body: AssignReviewDto) {
    return this.submissions.manualAssignReview(
      body.submissionId,
      body.reviewerId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER)
  @Delete("reviews/:reviewId")
  async deleteReview(@Param("reviewId") reviewId: string) {
    return this.submissions.deleteReview(reviewId);
  }
}
