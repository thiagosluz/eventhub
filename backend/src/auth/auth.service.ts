import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

interface RegisterOrganizerInput {
  tenantName: string;
  tenantSlug: string;
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerOrganizer(input: RegisterOrganizerInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email já está em uso.');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: input.tenantName,
        slug: input.tenantSlug,
      },
    });

    const passwordHash = await argon2.hash(input.password);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: passwordHash,
        role: 'ORGANIZER',
        tenantId: tenant.id,
      },
    });

    const token = await this.generateToken({
      userId: user.id,
      email: user.email,
      tenantId: tenant.id,
      role: user.role,
    });

    return { token };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { tenant: true },
    });

    if (!user || !(await argon2.verify(user.password, input.password))) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const token = await this.generateToken({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    return { token };
  }

  private async generateToken(params: {
    userId: string;
    email: string;
    tenantId: string;
    role: string;
  }) {
    const payload = {
      sub: params.userId,
      email: params.email,
      tenantId: params.tenantId,
      role: params.role,
    };

    return this.jwtService.signAsync(payload);
  }
}

