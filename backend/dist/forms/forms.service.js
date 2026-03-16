"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FormsService = class FormsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRegistrationForm(tenantId, eventId) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Evento não encontrado.');
        }
        return this.prisma.customForm.findFirst({
            where: { eventId, type: 'REGISTRATION' },
            include: {
                fields: { orderBy: { order: 'asc' } },
            },
        });
    }
    async saveRegistrationForm(tenantId, eventId, data) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Evento não encontrado.');
        }
        let form = await this.prisma.customForm.findFirst({
            where: { eventId, type: 'REGISTRATION' },
        });
        if (!form) {
            form = await this.prisma.customForm.create({
                data: {
                    eventId,
                    name: data.name,
                    type: 'REGISTRATION',
                },
            });
        }
        else if (form.name !== data.name) {
            form = await this.prisma.customForm.update({
                where: { id: form.id },
                data: { name: data.name },
            });
        }
        const existingFields = await this.prisma.customFormField.findMany({
            where: { formId: form.id },
        });
        const incomingFieldIds = data.fields.filter(f => f.id).map(f => f.id);
        const fieldsToDelete = existingFields.filter(f => !incomingFieldIds.includes(f.id));
        if (fieldsToDelete.length > 0) {
            await this.prisma.customFormField.deleteMany({
                where: { id: { in: fieldsToDelete.map(f => f.id) } },
            });
        }
        for (const fieldData of data.fields) {
            if (fieldData.id) {
                await this.prisma.customFormField.update({
                    where: { id: fieldData.id },
                    data: {
                        label: fieldData.label,
                        type: fieldData.type,
                        required: fieldData.required,
                        order: fieldData.order,
                        options: fieldData.options,
                    },
                });
            }
            else {
                await this.prisma.customFormField.create({
                    data: {
                        formId: form.id,
                        label: fieldData.label,
                        type: fieldData.type,
                        required: fieldData.required,
                        order: fieldData.order,
                        options: fieldData.options,
                    },
                });
            }
        }
        return this.getRegistrationForm(tenantId, eventId);
    }
};
exports.FormsService = FormsService;
exports.FormsService = FormsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FormsService);
//# sourceMappingURL=forms.service.js.map