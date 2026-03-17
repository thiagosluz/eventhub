import { Injectable, Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollmentStatus } from "../generated/prisma";

@Processor("activities")
@Injectable()
export class ActivitiesProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivitiesProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === "cleanup-expired-enrollments") {
      await this.cleanupExpiredEnrollments();
    }
  }

  private async cleanupExpiredEnrollments() {
    this.logger.log("Running cleanup for expired enrollments...");

    // Find all activities that require confirmation
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
          status: EnrollmentStatus.PENDING,
          createdAt: { lt: expirationDate },
        },
      });

      if (expiredEnrollments.length > 0) {
        this.logger.log(
          `Cancelling ${expiredEnrollments.length} expired enrollments for activity ${activity.title} (${activity.id})`,
        );

        await this.prisma.activityEnrollment.updateMany({
          where: {
            id: { in: expiredEnrollments.map((e) => e.id) },
          },
          data: {
            status: EnrollmentStatus.CANCELLED,
          },
        });
      }
    }
  }
}
