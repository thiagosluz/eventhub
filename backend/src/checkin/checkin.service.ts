import {
  ForbiddenException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckinService {
  constructor(private readonly prisma: PrismaService) {}

  async getQrCodePng(ticketId: string, userId: string): Promise<Buffer> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId },
      include: { registration: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ingresso não encontrado.');
    }

    if (ticket.registration.userId !== userId) {
      throw new ForbiddenException('Ingresso não pertence ao usuário.');
    }

    if (!ticket.qrCodeToken) {
      throw new NotFoundException('Ingresso sem token de QR Code.');
    }

    return QRCode.toBuffer(ticket.qrCodeToken, {
      type: 'png',
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
      where: { qrCodeToken, status: 'COMPLETED' },
      include: { attendances: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ingresso inválido ou não aprovado.');
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
        activityId: activityId ?? undefined,
      },
    });

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
      throw new ForbiddenException('Evento não pertence a este tenant.');
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
}
