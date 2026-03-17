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
var ActivitiesProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
const prisma_1 = require("../generated/prisma");
let ActivitiesProcessor = ActivitiesProcessor_1 = class ActivitiesProcessor extends bullmq_1.WorkerHost {
    constructor(prisma) {
        super();
        this.prisma = prisma;
        this.logger = new common_1.Logger(ActivitiesProcessor_1.name);
    }
    async process(job) {
        if (job.name === "cleanup-expired-enrollments") {
            await this.cleanupExpiredEnrollments();
        }
    }
    async cleanupExpiredEnrollments() {
        this.logger.log("Running cleanup for expired enrollments...");
        const activitiesWithConfirmation = await this.prisma.activity.findMany({
            where: {
                requiresConfirmation: true,
                confirmationDays: { not: null },
            },
        });
        for (const activity of activitiesWithConfirmation) {
            const days = activity.confirmationDays || 0;
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() - days);
            const expiredEnrollments = await this.prisma.activityEnrollment.findMany({
                where: {
                    activityId: activity.id,
                    status: prisma_1.EnrollmentStatus.PENDING,
                    createdAt: { lt: expirationDate },
                },
            });
            if (expiredEnrollments.length > 0) {
                this.logger.log(`Cancelling ${expiredEnrollments.length} expired enrollments for activity ${activity.title} (${activity.id})`);
                await this.prisma.activityEnrollment.updateMany({
                    where: {
                        id: { in: expiredEnrollments.map((e) => e.id) },
                    },
                    data: {
                        status: prisma_1.EnrollmentStatus.CANCELLED,
                    },
                });
            }
        }
    }
};
exports.ActivitiesProcessor = ActivitiesProcessor;
exports.ActivitiesProcessor = ActivitiesProcessor = ActivitiesProcessor_1 = __decorate([
    (0, bullmq_1.Processor)("activities"),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivitiesProcessor);
//# sourceMappingURL=activities.processor.js.map