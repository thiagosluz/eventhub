import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto, UpdatePasswordDto } from "./dto/update-user.dto";
import * as argon2 from "argon2";
import { MinioService } from "../storage/minio.service";
import { BadgesService } from "../badges/badges.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly badgesService: BadgesService,
  ) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
        tenantId: true,
      },
    });
    if (!user) throw new NotFoundException("Usuário não encontrado.");
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: userId } },
      });
      if (existing) {
        throw new ConflictException(
          "Este e-mail já está em uso por outro usuário.",
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
        tenantId: true,
      },
    });

    // Trigger Badge Check for Profile Completed
    await this.badgesService.checkAndAwardBadge(
      userId,
      null as any,
      "PROFILE_COMPLETED",
    );

    return updatedUser;
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException("Usuário não encontrado.");

    const isMatch = await argon2.verify(user.password, dto.currentPassword);
    if (!isMatch) {
      throw new UnauthorizedException("A senha atual está incorreta.");
    }

    const newPasswordHash = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    });

    return { message: "Senha atualizada com sucesso." };
  }

  async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException("Usuário não encontrado.");

    const objectName = `avatars/${userId}-${Date.now()}`;
    const url = await this.minio.uploadObject({
      bucket: "event-media",
      objectName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    // Trigger Badge Check for Profile Completed
    await this.badgesService.checkAndAwardBadge(
      userId,
      null as any,
      "PROFILE_COMPLETED",
    );

    return updatedUser;
  }
}
