import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updateTenant(id: string, data: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        logoUrl: data.logoUrl,
        themeConfig: data.themeConfig as any,
      } as any,
    });
  }
}
