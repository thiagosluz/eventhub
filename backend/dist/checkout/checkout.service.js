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
exports.CheckoutService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const activities_service_1 = require("../activities/activities.service");
const free_ticket_strategy_1 = require("./free-ticket.strategy");
const mail_service_1 = require("../mail/mail.service");
const badges_service_1 = require("../badges/badges.service");
let CheckoutService = class CheckoutService {
    constructor(prisma, activitiesService, freeTicketStrategy, mailService, badgesService) {
        this.prisma = prisma;
        this.activitiesService = activitiesService;
        this.freeTicketStrategy = freeTicketStrategy;
        this.mailService = mailService;
        this.badgesService = badgesService;
    }
    async processCheckout(input) {
        var _a;
        const { eventId, activityIds, userId } = input;
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException("Evento não encontrado.");
        }
        const existingRegistration = await this.prisma.registration.findFirst({
            where: {
                eventId,
                userId,
            },
        });
        if (existingRegistration) {
            throw new common_1.ConflictException("Você já possui uma inscrição para este evento.");
        }
        const registration = await this.prisma.registration.create({
            data: {
                eventId,
                userId,
            },
        });
        await this.badgesService.checkAndAwardBadge(userId, eventId, 'EARLY_BIRD');
        await this.badgesService.checkAndAwardBadge(userId, eventId, 'EVENT_COUNT');
        const autoEnrollActivities = await this.prisma.activity.findMany({
            where: {
                eventId,
                requiresEnrollment: false,
            },
        });
        if (autoEnrollActivities.length > 0) {
            await this.prisma.activityEnrollment.createMany({
                data: autoEnrollActivities.map((activity) => ({
                    activityId: activity.id,
                    registrationId: registration.id,
                })),
                skipDuplicates: true,
            });
        }
        for (const activityId of activityIds) {
            await this.activitiesService.enrollInActivity({
                userId,
                activityId,
            });
        }
        const payment = await this.freeTicketStrategy.process({
            userId,
            eventId,
            registrationId: registration.id,
            activityIds,
        });
        if ((_a = input.formResponses) === null || _a === void 0 ? void 0 : _a.length) {
            for (const fr of input.formResponses) {
                const response = await this.prisma.customFormResponse.create({
                    data: {
                        formId: fr.formId,
                        registrationId: registration.id,
                    },
                });
                for (const a of fr.answers) {
                    await this.prisma.customFormAnswer.create({
                        data: {
                            responseId: response.id,
                            fieldId: a.fieldId,
                            value: a.value,
                        },
                    });
                }
            }
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (user === null || user === void 0 ? void 0 : user.email) {
            await this.mailService.enqueue({
                to: user.email,
                subject: `Inscrição Confirmada: ${event.name}`,
                text: `Olá ${user.name || "Participante"},\n\nSua inscrição no evento "${event.name}" foi confirmada com sucesso!\n\nVocê pode acessar seus ingressos no dashboard do EventHub.`,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
            <h1 style="color: #10b981;">Inscrição Confirmada!</h1>
            <p>Olá <strong>${user.name || "Participante"}</strong>,</p>
            <p>Sua inscrição no evento <strong>${event.name}</strong> foi realizada com sucesso.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Evento:</strong> ${event.name}</p>
              <p style="margin: 5px 0 0 0;"><strong>Local:</strong> ${event.location || "A definir"}</p>
            </div>
            <p>Acesse seu painel para visualizar seus ingressos e QR Codes.</p>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3001"}/dashboard/my-tickets" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">Ver Meus Ingressos</a>
          </div>
        `,
            });
        }
        return {
            registrationId: registration.id,
            payment,
        };
    }
};
exports.CheckoutService = CheckoutService;
exports.CheckoutService = CheckoutService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activities_service_1.ActivitiesService,
        free_ticket_strategy_1.FreeTicketStrategy,
        mail_service_1.MailService,
        badges_service_1.BadgesService])
], CheckoutService);
//# sourceMappingURL=checkout.service.js.map