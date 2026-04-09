import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { AdminUpdateUserDto } from "./dto/update-user.dto";
import * as argon2 from "argon2";

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async listTenants(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { users: true, events: true },
          },
        },
      }),
      this.prisma.tenant.count(),
    ]);
    return { data, total, page, limit };
  }

  async toggleTenantStatus(id: string, isActive: boolean) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    return this.prisma.tenant.update({
      where: { id },
      data: { isActive },
    });
  }

  async getGlobalAuditLogs(
    page = 1,
    limit = 20,
    filters?: {
      tenantId?: string;
      userId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          event: { select: { name: true } },
          tenant: { select: { name: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getGlobalStats() {
    const [totalTenants, totalEvents, totalUsers] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.event.count(),
      this.prisma.user.count(),
    ]);

    // Logs por dia (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logsByDay = await this.prisma.auditLog.groupBy({
      by: ["createdAt"],
      _count: true,
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    });

    return {
      totalTenants,
      totalEvents,
      totalUsers,
      logsByDay,
    };
  }

  async impersonateUser(targetUserId: string, superAdminId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        speaker: { select: { id: true } },
      },
    });

    if (!targetUser)
      throw new NotFoundException("Usuário alvo não encontrado.");

    const payload = {
      sub: targetUser.id,
      email: targetUser.email,
      tenantId: targetUser.tenantId,
      role: targetUser.role,
      isSpeaker: !!targetUser.speaker || targetUser.role === "SPEAKER",
      mustChangePassword: targetUser.mustChangePassword,
      impersonatedBy: superAdminId, // Marca d'água do login fantasma
    };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: "15m",
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: "7d",
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        tenantId: targetUser.tenantId,
      },
    };
  }

  async createTenant(dto: CreateTenantDto) {
    // 1. Verificar se slug já existe
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existingTenant) {
      throw new ConflictException("Este slug já está sendo utilizado.");
    }

    // 2. Verificar se e-mail do admin já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });
    if (existingUser) {
      throw new ConflictException(
        "Este e-mail de administrador já está registrado.",
      );
    }

    const hashedPassword = await argon2.hash(dto.adminPassword);

    // 3. Criar Tenant e Usuário Admin em transação
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          isActive: true,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.adminEmail,
          name: dto.adminName,
          password: hashedPassword,
          role: "ORGANIZER",
          tenantId: tenant.id,
        },
      });

      return {
        tenant,
        admin: { id: user.id, email: user.email, name: user.name },
      };
    });
  }

  async listTenantUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async listGlobalUsers(
    page = 1,
    limit = 20,
    filters?: {
      search?: string;
      role?: string;
      tenantId?: string;
    },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.role) where.role = filters.role;
    if (filters?.tenantId) where.tenantId = filters.tenantId;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          tenant: { select: { name: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async updateGlobalUser(id: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Usuário não encontrado.");

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException(
          "Este e-mail já está em uso por outro usuário.",
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: dto as any,
    });
  }

  async resetGlobalUserPassword(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Usuário não encontrado.");

    // Senha padrão temporária para suporte
    const defaultPassword = "EventHub@2026";
    const hashedPassword = await argon2.hash(defaultPassword);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    return { message: "Senha redefinida com sucesso para: " + defaultPassword };
  }
}
