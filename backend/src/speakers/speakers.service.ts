import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';

@Injectable()
export class SpeakersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: CreateSpeakerDto) {
    return this.prisma.speaker.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.speaker.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const speaker = await this.prisma.speaker.findFirst({
      where: { id, tenantId },
    });

    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found.`);
    }

    return speaker;
  }

  async update(tenantId: string, id: string, data: UpdateSpeakerDto) {
    await this.findOne(tenantId, id);

    return this.prisma.speaker.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.speaker.delete({
      where: { id },
    });
  }
}
