"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../storage/minio.service");
const mail_service_1 = require("../mail/mail.service");
let SubmissionsService = class SubmissionsService {
    constructor(prisma, minio, mail, assignReviewsQueue) {
        this.prisma = prisma;
        this.minio = minio;
        this.mail = mail;
        this.assignReviewsQueue = assignReviewsQueue;
    }
    async createSubmission(params) {
        const { authorId, eventId, title, abstract, file } = params;
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: { tenant: true },
        });
        if (!event) {
            throw new common_1.NotFoundException("Evento não encontrado.");
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
            include: {
                author: true,
                event: true,
            }
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
        return submission;
    }
    async listSubmissionsForEvent(tenantId, eventId) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event) {
            throw new common_1.ForbiddenException("Evento não pertence a este tenant.");
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
        }));
    }
    async listMySubmissions(authorId) {
        return this.prisma.submission.findMany({
            where: { authorId },
            include: {
                event: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async listAssignedToReviewer(reviewerId) {
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
        }));
    }
    async submitReview(params) {
        const { reviewerId, submissionId, score, recommendation, comments } = params;
        const review = await this.prisma.review.findFirst({
            where: { submissionId, reviewerId },
        });
        if (!review) {
            throw new common_1.ForbiddenException("Revisor não está atribuído a esta submissão.");
        }
        return this.prisma.review.update({
            where: { id: review.id },
            data: {
                score,
                recommendation: recommendation,
                comments,
            },
        });
    }
};
exports.SubmissionsService = SubmissionsService;
exports.SubmissionsService = SubmissionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bullmq_1.InjectQueue)("assign-reviews")),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinioService,
        mail_service_1.MailService,
        bullmq_2.Queue])
], SubmissionsService);
//# sourceMappingURL=submissions.service.js.map