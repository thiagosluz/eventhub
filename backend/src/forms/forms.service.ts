import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegistrationForm(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new NotFoundException("Evento não encontrado.");
    }

    return this.prisma.customForm.findFirst({
      where: { eventId, type: "REGISTRATION" },
      include: {
        fields: { orderBy: { order: "asc" } },
      },
    });
  }

  async saveRegistrationForm(
    tenantId: string,
    eventId: string,
    data: {
      name: string;
      fields: {
        id?: string;
        label: string;
        type: string;
        required: boolean;
        order: number;
        options?: any;
      }[];
    },
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new NotFoundException("Evento não encontrado.");
    }

    let form = await this.prisma.customForm.findFirst({
      where: { eventId, type: "REGISTRATION" },
    });

    if (!form) {
      form = await this.prisma.customForm.create({
        data: {
          eventId,
          name: data.name,
          type: "REGISTRATION",
        },
      });
    } else if (form.name !== data.name) {
      form = await this.prisma.customForm.update({
        where: { id: form.id },
        data: { name: data.name },
      });
    }

    // Handle fields
    const existingFields = await this.prisma.customFormField.findMany({
      where: { formId: form.id },
    });

    const incomingFieldIds = data.fields.filter((f) => f.id).map((f) => f.id!);
    const fieldsToDelete = existingFields.filter(
      (f) => !incomingFieldIds.includes(f.id),
    );

    // Delete removed fields
    if (fieldsToDelete.length > 0) {
      await this.prisma.customFormField.deleteMany({
        where: { id: { in: fieldsToDelete.map((f) => f.id) } },
      });
    }

    // Upsert remaining fields
    for (const fieldData of data.fields) {
      if (fieldData.id) {
        await this.prisma.customFormField.update({
          where: { id: fieldData.id },
          data: {
            label: fieldData.label,
            type: fieldData.type as any,
            required: fieldData.required,
            order: fieldData.order,
            options: fieldData.options,
          },
        });
      } else {
        await this.prisma.customFormField.create({
          data: {
            formId: form.id,
            label: fieldData.label,
            type: fieldData.type as any,
            required: fieldData.required,
            order: fieldData.order,
            options: fieldData.options,
          },
        });
      }
    }

    return this.getRegistrationForm(tenantId, eventId);
  }
}
