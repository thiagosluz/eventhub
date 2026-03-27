import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AuthModule } from "./auth/auth.module";
import { ProtectedExampleController } from "./example/protected.controller";
import { EventsController } from "./events/events.controller";
import { EventsService } from "./events/events.service";
import { ActivitiesController } from "./activities/activities.controller";
import { ActivitiesService } from "./activities/activities.service";
import { SubmissionsController } from "./submissions/submissions.controller";
import { SubmissionsService } from "./submissions/submissions.service";
import { AssignReviewsProcessor } from "./submissions/submissions.processor";
import { SubmissionConfigController } from "./submissions/submission-config.controller";
import { SubmissionConfigService } from "./submissions/submission-config.service";
import { ActivitiesProcessor } from "./activities/activities.processor";
import { CheckoutController } from "./checkout/checkout.controller";
import { CheckoutService } from "./checkout/checkout.service";
import { FreeTicketStrategy } from "./checkout/free-ticket.strategy";
import { CheckinController } from "./checkin/checkin.controller";
import { CheckinService } from "./checkin/checkin.service";
import { CertificatesController } from "./certificates/certificates.controller";
import { CertificatePdfService } from "./certificates/certificate-pdf.service";
import { CertificateTemplatesService } from "./certificates/certificate-templates.service";
import { DashboardModule } from "./dashboard/dashboard.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SpeakersModule } from "./speakers/speakers.module";
import { TenantsModule } from "./tenants/tenants.module";
import { FormsModule } from "./forms/forms.module";
import { StorageModule } from "./storage/storage.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { SponsorsModule } from "./sponsors/sponsors.module";
import { UsersModule } from "./users/users.module";
import { BadgesModule } from "./badges/badges.module";
import { MailModule } from "./mail/mail.module";

@Module({
  imports: [
    AuthModule,
    DashboardModule,
    PrismaModule,
    SpeakersModule,
    TenantsModule,
    FormsModule,
    StorageModule,
    AnalyticsModule,
    SponsorsModule,
    UsersModule,
    BadgesModule,
    MailModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue(
      { name: "assign-reviews" },
      { name: "activities" },
    ),
  ],
  controllers: [
    ProtectedExampleController,
    EventsController,
    SubmissionsController,
    SubmissionConfigController,
    ActivitiesController,
    CheckoutController,
    CheckinController,
    CertificatesController,
  ],
  providers: [
    EventsService,
    ActivitiesService,
    SubmissionsService,
    SubmissionConfigService,
    AssignReviewsProcessor,
    ActivitiesProcessor,
    CheckoutService,
    FreeTicketStrategy,
    CheckinService,
    CertificatePdfService,
    CertificateTemplatesService,
  ],
})
export class AppModule {}
