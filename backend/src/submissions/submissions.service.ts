import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";

interface CreateSubmissionParams {
  authorId: string;
  eventId: string;
  title: string;
  abstract?: string;
  file: { buffer: Buffer; mimetype: string };
}

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    @InjectQueue("assign-reviews") private readonly assignReviewsQueue: Queue,
  ) {}

  async createSubmission(params: CreateSubmissionParams) {
    const { authorId, eventId, title, abstract, file } = params;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { tenant: true },
    });

    if (!event) {
      throw new NotFoundException("Evento não encontrado.");
    }

    const objectName = `events/${eventId}/submissions/${Date.now()}`;
    const fileUrl = await this.minio.uploadObject({
      bucket: "submissions",
      objectName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    const submission = await this.prisma.submission.create({
      data: {
        eventId,
        authorId,
        title,
        abstract,
        fileUrl,
      },
    });

    await this.assignReviewsQueue.add("assign", {
      submissionId: submission.id,
      eventId,
      tenantId: event.tenantId,
    });

    return submission;
  }

  async listSubmissionsForEvent(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new ForbiddenException("Evento não pertence a este tenant.");
    }

    const submissions = await this.prisma.submission.findMany({
      where: { eventId },
      include: {
        reviews: true,
      },
    });

    return submissions.map((s) => ({
      id: s.id,
      title: s.title,
      abstract: s.abstract,
      status: s.status,
      createdAt: s.createdAt,
      // double-blind: organizador vê tudo; autores/revisores são tratados em endpoints específicos
    }));
  }

  async listAssignedToReviewer(reviewerId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { reviewerId },
      include: {
        submission: {
          include: {
            event: true,
          },
        },
      },
    });

    return reviews.map((r) => ({
      reviewId: r.id,
      submissionId: r.submissionId,
      title: r.submission.title,
      abstract: r.submission.abstract,
      fileUrl: r.submission.fileUrl,
      status: r.submission.status,
      event: {
        id: r.submission.event.id,
        name: r.submission.event.name,
      },
      // double-blind: não expomos autor aqui
    }));
  }

  async submitReview(params: {
    reviewerId: string;
    submissionId: string;
    score?: number;
    recommendation?: string;
    comments?: string;
  }) {
    const { reviewerId, submissionId, score, recommendation, comments } =
      params;

    const review = await this.prisma.review.findFirst({
      where: { submissionId, reviewerId },
    });

    if (!review) {
      throw new ForbiddenException(
        "Revisor não está atribuído a esta submissão.",
      );
    }

    return this.prisma.review.update({
      where: { id: review.id },
      data: {
        score,
        recommendation: recommendation as any,
        comments,
      },
    });
  }
}
