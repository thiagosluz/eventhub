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
exports.SponsorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../storage/minio.service");
let SponsorsService = class SponsorsService {
    constructor(prisma, minio) {
        this.prisma = prisma;
        this.minio = minio;
    }
    async createCategory(tenantId, eventId, dto) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event)
            throw new common_1.NotFoundException("Evento não encontrado.");
        return this.prisma.sponsorCategory.create({
            data: {
                ...dto,
                eventId,
            },
        });
    }
    async listCategoriesByEvent(tenantId, eventId) {
        const event = await this.prisma.event.findFirst({
            where: { id: eventId, tenantId },
        });
        if (!event)
            throw new common_1.NotFoundException("Evento não encontrado.");
        return this.prisma.sponsorCategory.findMany({
            where: { eventId },
            orderBy: { displayOrder: "asc" },
            include: { sponsors: { orderBy: { displayOrder: "asc" } } },
        });
    }
    async updateCategory(tenantId, categoryId, dto) {
        const category = await this.prisma.sponsorCategory.findUnique({
            where: { id: categoryId },
            include: { event: true },
        });
        if (!category || category.event.tenantId !== tenantId) {
            throw new common_1.NotFoundException("Categoria não encontrada.");
        }
        return this.prisma.sponsorCategory.update({
            where: { id: categoryId },
            data: dto,
        });
    }
    async deleteCategory(tenantId, categoryId) {
        const category = await this.prisma.sponsorCategory.findUnique({
            where: { id: categoryId },
            include: { event: true },
        });
        if (!category || category.event.tenantId !== tenantId) {
            throw new common_1.NotFoundException("Categoria não encontrada.");
        }
        return this.prisma.sponsorCategory.delete({
            where: { id: categoryId },
        });
    }
    async createSponsor(tenantId, dto) {
        const category = await this.prisma.sponsorCategory.findUnique({
            where: { id: dto.categoryId },
            include: { event: true },
        });
        if (!category || category.event.tenantId !== tenantId) {
            throw new common_1.NotFoundException("Categoria não encontrada.");
        }
        return this.prisma.sponsor.create({
            data: {
                ...dto,
                logoUrl: dto.logoUrl || "",
            },
        });
    }
    async updateSponsor(tenantId, sponsorId, dto) {
        const sponsor = await this.prisma.sponsor.findUnique({
            where: { id: sponsorId },
            include: { category: { include: { event: true } } },
        });
        if (!sponsor || sponsor.category.event.tenantId !== tenantId) {
            throw new common_1.NotFoundException("Patrocinador não encontrado.");
        }
        return this.prisma.sponsor.update({
            where: { id: sponsorId },
            data: dto,
        });
    }
    async deleteSponsor(tenantId, sponsorId) {
        const sponsor = await this.prisma.sponsor.findUnique({
            where: { id: sponsorId },
            include: { category: { include: { event: true } } },
        });
        if (!sponsor || sponsor.category.event.tenantId !== tenantId) {
            throw new common_1.NotFoundException("Patrocinador não encontrado.");
        }
        return this.prisma.sponsor.delete({
            where: { id: sponsorId },
        });
    }
    async uploadLogo(tenantId, sponsorId, file) {
        const sponsor = await this.prisma.sponsor.findUnique({
            where: { id: sponsorId },
            include: { category: { include: { event: true } } },
        });
        if (!sponsor || sponsor.category.event.tenantId !== tenantId) {
            throw new common_1.NotFoundException("Patrocinador não encontrado.");
        }
        const objectName = `events/${sponsor.category.eventId}/sponsors/${sponsorId}-${Date.now()}`;
        const url = await this.minio.uploadObject({
            bucket: "event-media",
            objectName,
            data: file.buffer,
            contentType: file.mimetype,
        });
        return this.prisma.sponsor.update({
            where: { id: sponsorId },
            data: { logoUrl: url },
        });
    }
    async listPublicSponsorsByEventSlug(slug) {
        const event = await this.prisma.event.findFirst({
            where: { slug, status: "PUBLISHED" },
        });
        if (!event)
            throw new common_1.NotFoundException("Evento não encontrado.");
        return this.prisma.sponsorCategory.findMany({
            where: { eventId: event.id },
            orderBy: { displayOrder: "asc" },
            include: {
                sponsors: {
                    orderBy: { displayOrder: "asc" },
                },
            },
        });
    }
};
exports.SponsorsService = SponsorsService;
exports.SponsorsService = SponsorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinioService])
], SponsorsService);
//# sourceMappingURL=sponsors.service.js.map