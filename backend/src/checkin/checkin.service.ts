import {
  ForbiddenException,
  NotFoundException,
  Injectable,
} from "@nestjs/common";
import * as QRCode from "qrcode";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class CheckinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async getQrCodePng(ticketId: string, userId: string): Promise<Buffer> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId },
      include: { registration: true },
    });

    if (!ticket) {
      throw new NotFoundException("Ingresso não encontrado.");
    }

    if (ticket.registration.userId !== userId) {
      throw new ForbiddenException("Ingresso não pertence ao usuário.");
    }

    if (!ticket.qrCodeToken) {
      throw new NotFoundException("Ingresso sem token de QR Code.");
    }

    return QRCode.toBuffer(ticket.qrCodeToken, {
      type: "png",
      width: 256,
      margin: 2,
    });
  }

  async checkin(params: {
    qrCodeToken: string;
    activityId?: string;
  }): Promise<{ alreadyCheckedIn: boolean; attendanceId: string }> {
    const { qrCodeToken, activityId } = params;

    const ticket = await this.prisma.ticket.findUnique({
      where: { qrCodeToken, status: "COMPLETED" },
      include: { attendances: true },
    });

    if (!ticket) {
      throw new NotFoundException("Ingresso inválido ou não aprovado.");
    }

    if (activityId) {
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
      });
      if (!activity || activity.eventId !== ticket.eventId) {
        throw new NotFoundException("Atividade não pertence a este evento.");
      }

      if (activity.requiresEnrollment) {
        const enrollment = await this.prisma.activityEnrollment.findFirst({
          where: { activityId, registrationId: ticket.registrationId },
        });
        if (!enrollment) {
          throw new ForbiddenException(
            "Participante não está inscrito nesta atividade.",
          );
        }
      }
    }

    const existing = await this.prisma.attendance.findFirst({
      where: {
        ticketId: ticket.id,
        activityId: activityId || null,
      },
    });

    if (existing) {
      return { alreadyCheckedIn: true, attendanceId: existing.id };
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        ticketId: ticket.id,
        activityId: activityId ?? undefined,
      },
      include: {
        ticket: {
          include: {
            registration: {
              include: { user: true, event: true },
            },
          },
        },
      },
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
              <p style="margin: 0; color: #065f46;"><strong>Presença confirmada em:</strong> ${new Date().toLocaleString("pt-BR")}</p>
            </div>
            <p>Desejamos que você tenha uma excelente experiência!</p>
          </div>
        `,
      });
    }

    return { alreadyCheckedIn: false, attendanceId: attendance.id };
  }

  async drawRaffle(params: {
    tenantId: string;
    eventId: string;
    activityId?: string;
    count?: number;
  }): Promise<{ winners: { registrationId: string; userName: string }[] }> {
    const { tenantId, eventId, activityId, count = 1 } = params;

    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new ForbiddenException("Evento não pertence a este tenant.");
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

    const byRegistration = new Map<
      string,
      { registrationId: string; userName: string }
    >();
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

  async undoCheckin(attendanceId: string): Promise<void> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance) {
      throw new NotFoundException("Registro de presença não encontrado.");
    }

    await this.prisma.attendance.delete({
      where: { id: attendanceId },
    });
  }
}
