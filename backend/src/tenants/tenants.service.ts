import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { MinioService } from "../storage/minio.service";

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }

  async updateTenant(id: string, data: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        logoUrl: data.logoUrl,
        themeConfig: data.themeConfig as any,
        bio: data.bio,
        websiteUrl: data.websiteUrl,
        instagramUrl: data.instagramUrl,
        linkedinUrl: data.linkedinUrl,
        twitterUrl: data.twitterUrl,
        coverUrl: data.coverUrl,
      } as any,
    });
  }

  async getPublicTenant() {
    const tenant = await this.prisma.tenant.findFirst();
    if (!tenant) return null;
    const t = tenant as any;
    return {
      name: t.name,
      logoUrl: t.logoUrl,
      themeConfig: t.themeConfig,
      bio: t.bio,
      websiteUrl: t.websiteUrl,
      instagramUrl: t.instagramUrl,
      linkedinUrl: t.linkedinUrl,
      twitterUrl: t.twitterUrl,
      coverUrl: t.coverUrl,
    };
  }

  async findAllPublic() {
    return this.prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        coverUrl: true,
        bio: true,
        _count: {
          select: {
            events: {
              where: { status: "PUBLISHED" },
            },
          },
        },
      } as any,
      orderBy: { name: "asc" },
    });
  }

  async findOnePublic(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug, isActive: true },
      include: {
        users: {
          where: {
            publicProfile: true,
            role: { in: ["ORGANIZER", "SUPER_ADMIN"] },
          },
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
        events: {
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            name: true,
            slug: true,
            bannerUrl: true,
            startDate: true,
            endDate: true,
            location: true,
          },
          orderBy: { startDate: "asc" },
        },
      },
    });

    if (!tenant) throw new NotFoundException("Organizador não encontrado");
    return tenant;
  }

  async uploadLogo(
    tenantId: string,
    file: { buffer: Buffer; mimetype: string },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException("Organizador não encontrado");

    const t = tenant as any;
    // Cleanup old logo if exists
    if (t.logoUrl) {
      await this.deleteOldFile(t.logoUrl);
    }

    const objectName = `tenants/${tenantId}/logo-${Date.now()}`;
    const url = await this.minio.uploadObject({
      bucket: "event-media",
      objectName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: url } as any,
    });
  }

  async uploadCover(
    tenantId: string,
    file: { buffer: Buffer; mimetype: string },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException("Organizador não encontrado");

    const t = tenant as any;
    // Cleanup old cover if exists
    if (t.coverUrl) {
      await this.deleteOldFile(t.coverUrl);
    }

    const objectName = `tenants/${tenantId}/cover-${Date.now()}`;
    const url = await this.minio.uploadObject({
      bucket: "event-media",
      objectName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { coverUrl: url } as any,
    });
  }

  private async deleteOldFile(url: string) {
    try {
      // url example: http://localhost:9000/event-media/tenants/uuid/logo-1234.png
      const parts = url.split("/event-media/");
      if (parts.length > 1) {
        const objectName = parts[1];
        await this.minio.deleteObject("event-media", objectName);
      }
    } catch (error) {
      console.error("Erro ao deletar arquivo antigo do MinIO:", error);
    }
  }
}
