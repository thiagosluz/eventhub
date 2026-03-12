import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('assign-reviews')
@Injectable()
export class AssignReviewsProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ submissionId: string; eventId: string; tenantId: string }>): Promise<void> {
    const { submissionId, tenantId } = job.data;

    const reviewers = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: 'REVIEWER',
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

}

