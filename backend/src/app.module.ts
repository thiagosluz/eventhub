import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { ProtectedExampleController } from './example/protected.controller';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';
import { MinioService } from './storage/minio.service';
import { SubmissionsController } from './submissions/submissions.controller';
import { SubmissionsService } from './submissions/submissions.service';
import { AssignReviewsProcessor } from './submissions/submissions.processor';
import { CheckoutController } from './checkout/checkout.controller';
import { CheckoutService } from './checkout/checkout.service';
import { FreeTicketStrategy } from './checkout/free-ticket.strategy';
import { CheckinController } from './checkin/checkin.controller';
import { CheckinService } from './checkin/checkin.service';
import { MailService } from './mail/mail.service';
import { MailProcessor } from './mail/mail.processor';
import { CertificatesController } from './certificates/certificates.controller';
import { CertificatePdfService } from './certificates/certificate-pdf.service';
import { CertificateTemplatesService } from './certificates/certificate-templates.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrismaModule } from './prisma/prisma.module';
import { SpeakersModule } from './speakers/speakers.module';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [
    AuthModule,
    DashboardModule,
    PrismaModule,
    SpeakersModule,
    TenantsModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue(
      { name: 'assign-reviews' },
      { name: 'emails' },
    ),
  ],
  controllers: [
    ProtectedExampleController,
    EventsController,
    SubmissionsController,
    ActivitiesController,
    CheckoutController,
    CheckinController,
    CertificatesController,
  ],
  providers: [
    EventsService,
    ActivitiesService,
    MinioService,
    SubmissionsService,
    AssignReviewsProcessor,
    CheckoutService,
    FreeTicketStrategy,
    CheckinService,
    MailService,
    MailProcessor,
    CertificatePdfService,
    CertificateTemplatesService,
  ],
})
export class AppModule {}
