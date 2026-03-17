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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificatePdfService = void 0;
const common_1 = require("@nestjs/common");
const pdfkit_1 = __importDefault(require("pdfkit"));
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../storage/minio.service");
let CertificatePdfService = class CertificatePdfService {
    constructor(prisma, minio) {
        this.prisma = prisma;
        this.minio = minio;
    }
    async generatePreview(params) {
        var _a;
        const { backgroundUrl, layoutConfig } = params;
        const data = {
            participantName: "Nome do Participante (Exemplo)",
            eventName: "Nome do Evento (Exemplo)",
            workload: "10h",
        };
        const placeholders = (_a = layoutConfig.placeholders) !== null && _a !== void 0 ? _a : [
            { key: "participantName", x: 100, y: 280, fontSize: 24 },
            { key: "eventName", x: 100, y: 340, fontSize: 14 },
            { key: "workload", x: 100, y: 380, fontSize: 12 },
        ];
        return this.renderPdf(backgroundUrl, placeholders, data);
    }
    async generateAndStore(templateId, registrationId) {
        var _a, _b;
        const template = await this.prisma.certificateTemplate.findFirst({
            where: { id: templateId },
            include: { event: true },
        });
        if (!template) {
            throw new common_1.NotFoundException("Template de certificado não encontrado.");
        }
        const registration = await this.prisma.registration.findFirst({
            where: { id: registrationId, eventId: template.eventId },
            include: { user: true, event: true },
        });
        if (!registration) {
            throw new common_1.NotFoundException("Inscrição não encontrada para este evento.");
        }
        const data = {
            participantName: registration.user.name,
            eventName: registration.event.name,
            workload: "8h",
        };
        const layout = (_a = template.layoutConfig) !== null && _a !== void 0 ? _a : {};
        const placeholders = (_b = layout.placeholders) !== null && _b !== void 0 ? _b : [
            { key: "participantName", x: 100, y: 280, fontSize: 24 },
            { key: "eventName", x: 100, y: 340, fontSize: 14 },
            { key: "workload", x: 100, y: 380, fontSize: 12 },
        ];
        const pdfBuffer = await this.renderPdf(template.backgroundUrl, placeholders, data);
        const objectName = `certificates/${template.eventId}/${registrationId}-${Date.now()}.pdf`;
        const fileUrl = await this.minio.uploadObject({
            bucket: "certificates",
            objectName,
            data: pdfBuffer,
            contentType: "application/pdf",
        });
        const issued = await this.prisma.issuedCertificate.create({
            data: {
                templateId: template.id,
                registrationId: registration.id,
                fileUrl,
            },
        });
        return { fileUrl, issuedId: issued.id };
    }
    async renderPdf(backgroundUrl, placeholders, data) {
        const imageBuffer = await this.fetchImage(backgroundUrl);
        return new Promise((resolve, reject) => {
            var _a;
            const doc = new pdfkit_1.default({
                size: "A4",
                layout: "landscape",
                margin: 0,
                bufferPages: true,
            });
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);
            doc.image(imageBuffer, 0, 0, { width: 841.89, height: 595.28 });
            for (const p of placeholders) {
                const value = (_a = data[p.key]) !== null && _a !== void 0 ? _a : "";
                const fontSize = p.fontSize || 16;
                doc.fontSize(fontSize);
                if (p.fontFamily) {
                    doc.font(p.fontFamily);
                }
                else if (p.key === "participantName") {
                    doc.font("Helvetica-Bold");
                }
                else {
                    doc.font("Helvetica");
                }
                doc.fillColor(p.color || "#000000");
                doc.text(value, p.x, p.y);
            }
            doc.end();
        });
    }
    async fetchImage(url) {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Falha ao carregar imagem do certificado: ${res.status}`);
        }
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
};
exports.CertificatePdfService = CertificatePdfService;
exports.CertificatePdfService = CertificatePdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinioService])
], CertificatePdfService);
//# sourceMappingURL=certificate-pdf.service.js.map