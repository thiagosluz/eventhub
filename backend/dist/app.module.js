"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const auth_module_1 = require("./auth/auth.module");
const protected_controller_1 = require("./example/protected.controller");
const events_controller_1 = require("./events/events.controller");
const events_service_1 = require("./events/events.service");
const activities_controller_1 = require("./activities/activities.controller");
const activities_service_1 = require("./activities/activities.service");
const submissions_controller_1 = require("./submissions/submissions.controller");
const submissions_service_1 = require("./submissions/submissions.service");
const submissions_processor_1 = require("./submissions/submissions.processor");
const checkout_controller_1 = require("./checkout/checkout.controller");
const checkout_service_1 = require("./checkout/checkout.service");
const free_ticket_strategy_1 = require("./checkout/free-ticket.strategy");
const checkin_controller_1 = require("./checkin/checkin.controller");
const checkin_service_1 = require("./checkin/checkin.service");
const mail_service_1 = require("./mail/mail.service");
const mail_processor_1 = require("./mail/mail.processor");
const certificates_controller_1 = require("./certificates/certificates.controller");
const certificate_pdf_service_1 = require("./certificates/certificate-pdf.service");
const certificate_templates_service_1 = require("./certificates/certificate-templates.service");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const prisma_module_1 = require("./prisma/prisma.module");
const speakers_module_1 = require("./speakers/speakers.module");
const tenants_module_1 = require("./tenants/tenants.module");
const forms_module_1 = require("./forms/forms.module");
const storage_module_1 = require("./storage/storage.module");
const analytics_module_1 = require("./analytics/analytics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            dashboard_module_1.DashboardModule,
            prisma_module_1.PrismaModule,
            speakers_module_1.SpeakersModule,
            tenants_module_1.TenantsModule,
            forms_module_1.FormsModule,
            storage_module_1.StorageModule,
            analytics_module_1.AnalyticsModule,
            bullmq_1.BullModule.forRoot({
                connection: {
                    host: (_a = process.env.REDIS_HOST) !== null && _a !== void 0 ? _a : 'localhost',
                    port: Number((_b = process.env.REDIS_PORT) !== null && _b !== void 0 ? _b : 6379),
                },
            }),
            bullmq_1.BullModule.registerQueue({ name: 'assign-reviews' }, { name: 'emails' }),
        ],
        controllers: [
            protected_controller_1.ProtectedExampleController,
            events_controller_1.EventsController,
            submissions_controller_1.SubmissionsController,
            activities_controller_1.ActivitiesController,
            checkout_controller_1.CheckoutController,
            checkin_controller_1.CheckinController,
            certificates_controller_1.CertificatesController,
        ],
        providers: [
            events_service_1.EventsService,
            activities_service_1.ActivitiesService,
            submissions_service_1.SubmissionsService,
            submissions_processor_1.AssignReviewsProcessor,
            checkout_service_1.CheckoutService,
            free_ticket_strategy_1.FreeTicketStrategy,
            checkin_service_1.CheckinService,
            mail_service_1.MailService,
            mail_processor_1.MailProcessor,
            certificate_pdf_service_1.CertificatePdfService,
            certificate_templates_service_1.CertificateTemplatesService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map