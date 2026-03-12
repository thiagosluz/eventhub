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
let CheckoutService = class CheckoutService {
    constructor(prisma, activitiesService, freeTicketStrategy) {
        this.prisma = prisma;
        this.activitiesService = activitiesService;
        this.freeTicketStrategy = freeTicketStrategy;
    }
    async processCheckout(input) {
        const { eventId, activityIds, userId } = input;
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new Error('Evento não encontrado.');
        }
        let registration = await this.prisma.registration.findFirst({
            where: {
                eventId,
                userId,
            },
        });
        if (!registration) {
            registration = await this.prisma.registration.create({
                data: {
                    eventId,
                    userId,
                },
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
        free_ticket_strategy_1.FreeTicketStrategy])
], CheckoutService);
//# sourceMappingURL=checkout.service.js.map