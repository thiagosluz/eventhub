import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { ProtectedExampleController } from './example/protected.controller';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';
import { PrismaService } from './prisma/prisma.service';
import { MinioService } from './storage/minio.service';
import { SubmissionsController } from './submissions/submissions.controller';
import { SubmissionsService } from './submissions/submissions.service';
import { AssignReviewsProcessor } from './submissions/submissions.processor';

@Module({
  imports: [
    AuthModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({
      name: 'assign-reviews',
    }),
  ],
  controllers: [
    ProtectedExampleController,
    EventsController,
    SubmissionsController,
    ActivitiesController,
  ],
  providers: [
    EventsService,
    ActivitiesService,
    PrismaService,
    MinioService,
    SubmissionsService,
    AssignReviewsProcessor,
  ],
})
export class AppModule {}
