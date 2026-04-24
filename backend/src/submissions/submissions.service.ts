import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { MinioService } from "../storage/minio.service";
import { MailService } from "../mail/mail.service";
import { GamificationService } from "../gamification/gamification.service";

interface CreateSubmissionParams {
  authorId: string;
  eventId: string;
  title: string;
  abstract?: string;
  modalityId?: string;
  thematicAreaId?: string;
  file: { buffer: Buffer; mimetype: string };
}

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly mail: MailService,
    @InjectQueue("assign-reviews") private readonly assignReviewsQueue: Queue,
    private readonly gamificationService: GamificationService,
  ) {}

  async createSubmission(params: CreateSubmissionParams) {
    const {
      authorId,
      eventId,
      title,
      abstract,
      modalityId,
      thematicAreaId,
      file,
    } = params;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { tenant: true },
    });

    if (!event) {
      throw new NotFoundException("Evento não encontrado.");
    }

    // Deadline enforcement
    if (!event.submissionsEnabled) {
      throw new ForbiddenException(
        "O módulo de submissões está desativado para este evento.",
      );
    }

    const now = new Date();

    if (event.submissionStartDate && now < event.submissionStartDate) {
      throw new ForbiddenException(
        "O período de submissões ainda não iniciou.",
      );
    }

    if (event.submissionEndDate && now > event.submissionEndDate) {
      throw new ForbiddenException("O prazo para submissões já encerrou.");
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
        modalityId,
        thematicAreaId,
      },
      include: {
        author: true,
        event: true,
      },
    });

    if (submission.author.email) {
      await this.mail.enqueue({
        to: submission.author.email,
        subject: `Trabalho Recebido: ${submission.title}`,
        text: `Olá ${submission.author.name},\n\nConfirmamos o recebimento do seu trabalho "${submission.title}" para o evento "${submission.event.name}".\n\nVocê pode acompanhar o status da avaliação no seu painel.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h1 style="color: #6366f1;">Trabalho Recebido!</h1>
            <p>Olá <strong>${submission.author.name}</strong>,</p>
            <p>Confirmamos o recebimento da sua submissão para o evento <strong>${submission.event.name}</strong>.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Título:</strong> ${submission.title}</p>
              <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Aguardando Avaliação</p>
            </div>
            <p>Obrigado por contribuir com nosso evento!</p>
          </div>
        `,
      });
    }

    await this.assignReviewsQueue.add("assign", {
      submissionId: submission.id,
      eventId,
      tenantId: event.tenantId,
    });

    const xpAmount = await this.gamificationService.getXpForAction("SUBMISSION_CREATED");
    await this.gamificationService.awardXp(
      authorId,
      xpAmount,
      "SUBMISSION_CREATED",
      `SUBMISSION_CREATED_${submission.id}`,
      eventId
    );

    return submission;
  }

  async listSubmissionsForEvent(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new ForbiddenException("Evento não pertence a este tenant.");
    }

    return this.prisma.submission.findMany({
      where: { eventId },
      include: {
        author: { select: { name: true, email: true } },
        modality: true,
        thematicArea: true,
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async listEventReviewers(eventId: string) {
    const items = await this.prisma.eventReviewer.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });
    return items.map((i) => i.user);
  }

  async addReviewerToEvent(eventId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Usuário não encontrado.");
    if (user.role !== "REVIEWER") {
      throw new ForbiddenException("Usuário não possui papel de revisor.");
    }

    return this.prisma.eventReviewer.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId },
      update: {},
    });
  }

  async removeReviewerFromEvent(eventId: string, userId: string) {
    return this.prisma.eventReviewer.deleteMany({
      where: { eventId, userId },
    });
  }

  async manualAssignReview(submissionId: string, reviewerId: string) {
    const existing = await this.prisma.review.findFirst({
      where: { submissionId, reviewerId },
    });
    if (existing) return existing;

    return this.prisma.review.create({
      data: { submissionId, reviewerId },
    });
  }

  async deleteReview(reviewId: string) {
    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }

  async listMySubmissions(authorId: string) {
    return this.prisma.submission.findMany({
      where: { authorId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
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
      id: r.id,
      submissionId: r.submissionId,
      score: r.score,
      recommendation: r.recommendation,
      comments: r.comments,
      submission: {
        id: r.submissionId,
        title: r.submission.title,
        abstract: r.submission.abstract,
        fileUrl: r.submission.fileUrl,
        status: r.submission.status,
        event: {
          id: r.submission.event.id,
          name: r.submission.event.name,
          reviewEndDate: r.submission.event.reviewEndDate,
        },
      },
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
      include: {
        submission: {
          include: { event: true },
        },
      },
    });

    if (!review) {
      throw new ForbiddenException(
        "Revisor não está atribuído a esta submissão.",
      );
    }

    // Review deadline enforcement
    const event = review.submission.event;
    const now = new Date();

    if (event.reviewEndDate && now > event.reviewEndDate) {
      throw new ForbiddenException("O prazo para revisões já encerrou.");
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
