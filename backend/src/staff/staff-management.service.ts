import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as argon2 from "argon2";
import { CreateOrganizerDto } from "./dto/create-organizer.dto";

@Injectable()
export class StaffManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganizer(tenantId: string, data: CreateOrganizerDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException("Usuário com este email já existe");
    }

    const hashedPassword = await argon2.hash(data.temporaryPassword);

    return await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: "ORGANIZER",
        tenantId,
        mustChangePassword: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async listOrganizers(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role: "ORGANIZER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async assignMonitor(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) throw new NotFoundException("Evento não encontrado");

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException("Usuário não encontrado");

    return this.prisma.eventMonitor.upsert({
      where: {
        eventId_userId: { eventId, userId },
      },
      create: { eventId, userId },
      update: {},
    });
  }

  async removeMonitor(eventId: string, userId: string) {
    return this.prisma.eventMonitor.delete({
      where: {
        eventId_userId: { eventId, userId },
      },
    });
  }

  async listMonitors(eventId: string) {
    return this.prisma.eventMonitor.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listEventParticipants(eventId: string) {
    return this.prisma.registration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}
