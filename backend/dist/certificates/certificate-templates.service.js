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
exports.CertificateTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../storage/minio.service");
let CertificateTemplatesService = class CertificateTemplatesService {
    constructor(prisma, minio) {
        this.prisma = prisma;
        this.minio = minio;
    }
    async listByEvent(tenantId, eventId) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event)
            throw new common_1.ForbiddenException('Evento não pertence a este tenant.');
        return this.prisma.certificateTemplate.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(tenantId, eventId, data) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event)
            throw new common_1.ForbiddenException('Evento não pertence a este tenant.');
        return this.prisma.certificateTemplate.create({
            data: {
                eventId,
                name: data.name,
                backgroundUrl: data.backgroundUrl,
                layoutConfig: data.layoutConfig,
            },
        });
    }
    async findOne(tenantId, id) {
        const template = await this.prisma.certificateTemplate.findFirst({
            where: { id, event: { tenantId } },
        });
        if (!template)
            throw new common_1.NotFoundException('Template não encontrado.');
        return template;
    }
    async update(tenantId, id, data) {
        await this.findOne(tenantId, id);
        return this.prisma.certificateTemplate.update({
            where: { id },
            data: {
                name: data.name,
                backgroundUrl: data.backgroundUrl,
                layoutConfig: data.layoutConfig,
            },
        });
    }
    async uploadBackground(tenantId, templateId, file) {
        await this.findOne(tenantId, templateId);
        const objectName = `certificate-templates/${templateId}/background-${Date.now()}`;
        const url = await this.minio.uploadObject({
            bucket: 'event-media',
            objectName,
            data: file.buffer,
            contentType: file.mimetype,
        });
        return this.prisma.certificateTemplate.update({
            where: { id: templateId },
            data: { backgroundUrl: url },
        });
    }
};
exports.CertificateTemplatesService = CertificateTemplatesService;
exports.CertificateTemplatesService = CertificateTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinioService])
], CertificateTemplatesService);
//# sourceMappingURL=certificate-templates.service.js.map