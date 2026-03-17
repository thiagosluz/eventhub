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
exports.FreeTicketStrategy = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FreeTicketStrategy = class FreeTicketStrategy {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async process(ctx) {
        const tickets = [];
        const eventTicket = await this.prisma.ticket.create({
            data: {
                eventId: ctx.eventId,
                registrationId: ctx.registrationId,
                type: "FREE",
                status: "COMPLETED",
                price: 0,
                qrCodeToken: (0, crypto_1.randomUUID)(),
            },
        });
        tickets.push(eventTicket);
        if (ctx.activityIds.length > 0) {
            for (const _activityId of ctx.activityIds) {
                const activityTicket = await this.prisma.ticket.create({
                    data: {
                        eventId: ctx.eventId,
                        registrationId: ctx.registrationId,
                        type: "FREE",
                        status: "COMPLETED",
                        price: 0,
                        qrCodeToken: (0, crypto_1.randomUUID)(),
                    },
                });
                tickets.push(activityTicket);
            }
        }
        return {
            tickets: tickets.map((t) => ({
                id: t.id,
                type: t.type,
                status: t.status,
                price: "0.00",
            })),
            totalAmount: "0.00",
        };
    }
};
exports.FreeTicketStrategy = FreeTicketStrategy;
exports.FreeTicketStrategy = FreeTicketStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FreeTicketStrategy);
//# sourceMappingURL=free-ticket.strategy.js.map