import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSpeakerDto } from "./dto/create-speaker.dto";
import { UpdateSpeakerDto } from "./dto/update-speaker.dto";
import { MinioService } from "../storage/minio.service";

@Injectable()
export class SpeakersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

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
      orderBy: { name: "asc" },
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

  async uploadAvatar(
    tenantId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const fileExt = file.originalname.split(".").pop();
    const fileName = `speakers/${tenantId}/${Date.now()}.${fileExt}`;

    const url = await this.minio.uploadObject({
      bucket: "eventhub",
      objectName: fileName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    return { url };
  }

  // Speaker Roles
  async createRole(tenantId: string, name: string) {
    return this.prisma.speakerRole.create({
      data: { tenantId, name },
    });
  }

  async findAllRoles(tenantId: string) {
    return this.prisma.speakerRole.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async removeRole(tenantId: string, id: string) {
    const role = await this.prisma.speakerRole.findFirst({
      where: { id, tenantId },
    });
    if (!role) throw new NotFoundException("Role not found");
    return this.prisma.speakerRole.delete({ where: { id } });
  }
}
