"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckinService = void 0;
const common_1 = require("@nestjs/common");
const QRCode = __importStar(require("qrcode"));
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
let CheckinService = class CheckinService {
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
    }
    async getQrCodePng(ticketId, userId) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId },
            include: { registration: true },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Ingresso não encontrado.');
        }
        if (ticket.registration.userId !== userId) {
            throw new common_1.ForbiddenException('Ingresso não pertence ao usuário.');
        }
        if (!ticket.qrCodeToken) {
            throw new common_1.NotFoundException('Ingresso sem token de QR Code.');
        }
        return QRCode.toBuffer(ticket.qrCodeToken, {
            type: 'png',
            width: 256,
            margin: 2,
        });
    }
    async checkin(params) {
        const { qrCodeToken, activityId } = params;
        const ticket = await this.prisma.ticket.findUnique({
            where: { qrCodeToken, status: 'COMPLETED' },
            include: { attendances: true },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Ingresso inválido ou não aprovado.');
        }
        const existing = await this.prisma.attendance.findFirst({
            where: {
                ticketId: ticket.id,
                ...(activityId ? { activityId } : { activityId: null }),
            },
        });
        if (existing) {
            return { alreadyCheckedIn: true, attendanceId: existing.id };
        }
        const attendance = await this.prisma.attendance.create({
            data: {
                ticketId: ticket.id,
                activityId: activityId !== null && activityId !== void 0 ? activityId : undefined,
            },
            include: {
                ticket: {
                    include: {
                        registration: {
                            include: { user: true, event: true }
                        }
                    }
                }
            }
        });
        const user = attendance.ticket.registration.user;
        const event = attendance.ticket.registration.event;
        if (user.email) {
            await this.mailService.enqueue({
                to: user.email,
                subject: `Check-in Realizado: ${event.name}`,
                text: `Olá ${user.name},\n\nSeu check-in no evento "${event.name}" foi realizado com sucesso!\n\nAproveite o evento!`,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #10b981; border-radius: 12px;">
            <h1 style="color: #10b981;">Check-in Confirmado! ✅</h1>
            <p>Olá <strong>${user.name}</strong>,</p>
            <p>Seu check-in no evento <strong>${event.name}</strong> acaba de ser realizado.</p>
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #10b981;">
              <p style="margin: 0; color: #065f46;"><strong>Presença confirmada em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <p>Desejamos que você tenha uma excelente experiência!</p>
          </div>
        `,
            });
        }
        return { alreadyCheckedIn: false, attendanceId: attendance.id };
    }
    async drawRaffle(params) {
        const { tenantId, eventId, activityId, count = 1 } = params;
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event) {
            throw new common_1.ForbiddenException('Evento não pertence a este tenant.');
        }
        const attendances = await this.prisma.attendance.findMany({
            where: {
                ticket: { eventId },
                ...(activityId ? { activityId } : {}),
            },
            include: {
                ticket: {
                    include: {
                        registration: {
                            include: { user: true },
                        },
                    },
                },
            },
        });
        const byRegistration = new Map();
        for (const a of attendances) {
            const reg = a.ticket.registration;
            byRegistration.set(reg.id, {
                registrationId: reg.id,
                userName: reg.user.name,
            });
        }
        const pool = Array.from(byRegistration.values());
        if (pool.length === 0) {
            return { winners: [] };
        }
        const drawCount = Math.min(count, pool.length);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const winners = shuffled.slice(0, drawCount);
        return { winners };
    }
};
exports.CheckinService = CheckinService;
exports.CheckinService = CheckinService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], CheckinService);
//# sourceMappingURL=checkin.service.js.map