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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignReviewsProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
let AssignReviewsProcessor = class AssignReviewsProcessor extends bullmq_1.WorkerHost {
    constructor(prisma) {
        super();
        this.prisma = prisma;
    }
    async process(job) {
        const { submissionId, tenantId } = job.data;
        const reviewers = await this.prisma.user.findMany({
            where: {
                tenantId,
                role: "REVIEWER",
            },
        });
        if (reviewers.length === 0) {
            return;
        }
        const existingReviews = await this.prisma.review.findMany({
            where: { submissionId },
        });
        if (existingReviews.length > 0) {
            return;
        }
        const toCreate = reviewers.map((reviewer) => ({
            submissionId,
            reviewerId: reviewer.id,
        }));
        await this.prisma.review.createMany({
            data: toCreate,
        });
    }
};
exports.AssignReviewsProcessor = AssignReviewsProcessor;
exports.AssignReviewsProcessor = AssignReviewsProcessor = __decorate([
    (0, bullmq_1.Processor)("assign-reviews"),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssignReviewsProcessor);
//# sourceMappingURL=submissions.processor.js.map