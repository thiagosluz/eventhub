import { Injectable, Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { EnrollmentStatus } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

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

    const pendingEnrollments = await this.prisma.activityEnrollment.findMany({
      where: {
        status: EnrollmentStatus.PENDING,
        activity: {
          requiresConfirmation: true,
          confirmationDays: { not: null },
        },
      },
      select: {
        id: true,
        createdAt: true,
        activity: {
          select: { id: true, title: true, confirmationDays: true },
        },
      },
    });

    const now = Date.now();
    const expired = pendingEnrollments.filter((e) => {
      const days = e.activity.confirmationDays ?? 0;
      return now - e.createdAt.getTime() > days * DAY_MS;
    });

    if (expired.length === 0) {
      return;
    }

    const byActivity = new Map<string, { title: string; count: number }>();
    for (const e of expired) {
      const entry = byActivity.get(e.activity.id) ?? {
        title: e.activity.title,
        count: 0,
      };
      entry.count += 1;
      byActivity.set(e.activity.id, entry);
    }
    for (const [activityId, { title, count }] of byActivity) {
      this.logger.log(
        `Cancelling ${count} expired enrollments for activity ${title} (${activityId})`,
      );
    }

    await this.prisma.activityEnrollment.updateMany({
      where: { id: { in: expired.map((e) => e.id) } },
      data: { status: EnrollmentStatus.CANCELLED },
    });
  }
}
