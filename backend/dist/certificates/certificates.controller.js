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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificatesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const roles_types_1 = require("../auth/roles.types");
const certificate_pdf_service_1 = require("./certificate-pdf.service");
const certificate_templates_service_1 = require("./certificate-templates.service");
const mail_service_1 = require("../mail/mail.service");
const prisma_service_1 = require("../prisma/prisma.service");
let CertificatesController = class CertificatesController {
    constructor(certificatePdf, certificateTemplates, mail, prisma) {
        this.certificatePdf = certificatePdf;
        this.certificateTemplates = certificateTemplates;
        this.mail = mail;
        this.prisma = prisma;
    }
    async listTemplates(eventId, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error("Missing tenantId on token payload.");
        return this.certificateTemplates.listByEvent(tenantId, eventId);
    }
    async createTemplate(eventId, body, req) {
        var _a, _b;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error("Missing tenantId on token payload.");
        return this.certificateTemplates.create(tenantId, eventId, {
            name: body.name,
            backgroundUrl: body.backgroundUrl,
            layoutConfig: (_b = body.layoutConfig) !== null && _b !== void 0 ? _b : { placeholders: [] },
        });
    }
    async getTemplate(id, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error("Missing tenantId on token payload.");
        return this.certificateTemplates.findOne(tenantId, id);
    }
    async updateTemplate(id, body, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error("Missing tenantId on token payload.");
        return this.certificateTemplates.update(tenantId, id, body);
    }
    async uploadTemplateBackground(id, file, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error("Missing tenantId on token payload.");
        if (!(file === null || file === void 0 ? void 0 : file.buffer))
            throw new common_1.BadRequestException("Arquivo de imagem é obrigatório.");
        return this.certificateTemplates.uploadBackground(tenantId, id, {
            buffer: file.buffer,
            mimetype: file.mimetype,
        });
    }
    async previewTemplate(body, res) {
        const pdfBuffer = await this.certificatePdf.generatePreview({
            backgroundUrl: body.backgroundUrl,
            layoutConfig: body.layoutConfig,
        });
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline; filename=preview.pdf",
            "Content-Length": pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    async issueBulk(templateId, body, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error("Missing tenantId on token payload.");
        const template = await this.certificateTemplates.findOne(tenantId, templateId);
        const registrations = await this.prisma.registration.findMany({
            where: { eventId: template.eventId },
            include: { user: true },
        });
        const results = [];
        for (const reg of registrations) {
            try {
                const { fileUrl } = await this.certificatePdf.generateAndStore(templateId, reg.id);
                if (body.sendEmail && reg.user.email) {
                    await this.mail.enqueue({
                        to: reg.user.email,
                        subject: "Seu certificado está pronto",
                        text: `Acesse seu certificado em: ${fileUrl}`,
                        html: `<p>Acesse seu certificado em: <a href="${fileUrl}">${fileUrl}</a></p>`,
                    });
                }
                results.push({ registrationId: reg.id, status: "success", fileUrl });
            }
            catch (error) {
                results.push({
                    registrationId: reg.id,
                    status: "error",
                    error: error.message,
                });
            }
        }
        return {
            total: registrations.length,
            processed: results.length,
            details: results,
        };
    }
    async issueCertificate(body) {
        const { fileUrl, issuedId } = await this.certificatePdf.generateAndStore(body.templateId, body.registrationId);
        if (body.sendEmail) {
            const reg = await this.prisma.registration.findUnique({
                where: { id: body.registrationId },
                include: { user: true },
            });
            if (reg === null || reg === void 0 ? void 0 : reg.user.email) {
                await this.mail.enqueue({
                    to: reg.user.email,
                    subject: "Seu certificado está pronto",
                    text: `Acesse seu certificado em: ${fileUrl}`,
                    html: `<p>Acesse seu certificado em: <a href="${fileUrl}">${fileUrl}</a></p>`,
                });
            }
        }
        return { issuedId, fileUrl };
    }
    async listMyCertificates(req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        if (!userId)
            throw new Error("Missing userId on token payload.");
        return this.prisma.issuedCertificate.findMany({
            where: {
                registration: { userId },
            },
            include: {
                template: {
                    include: {
                        event: {
                            select: {
                                name: true,
                                slug: true,
                                startDate: true,
                            },
                        },
                    },
                },
            },
            orderBy: { issuedAt: "desc" },
        });
    }
    async validateCertificate(hash) {
        const certificate = await this.prisma.issuedCertificate.findUnique({
            where: { validationHash: hash },
            include: {
                registration: {
                    include: { user: true, event: true },
                },
                template: {
                    include: { event: true },
                },
            },
        });
        if (!certificate) {
            throw new common_1.NotFoundException("Certificado inválido ou não encontrado.");
        }
        return {
            isValid: true,
            hash: certificate.validationHash,
            issuedAt: certificate.issuedAt,
            fileUrl: certificate.fileUrl,
            participantName: certificate.registration.user.name,
            eventName: certificate.template.event.name,
        };
    }
};
exports.CertificatesController = CertificatesController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)("templates/event/:eventId"),
    __param(0, (0, common_1.Param)("eventId")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("templates/event/:eventId"),
    __param(0, (0, common_1.Param)("eventId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)("templates/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Patch)("templates/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("templates/:id/background"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "uploadTemplateBackground", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("templates/preview"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "previewTemplate", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("templates/:templateId/issue-bulk"),
    __param(0, (0, common_1.Param)("templateId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "issueBulk", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("issue"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "issueCertificate", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("my"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "listMyCertificates", null);
__decorate([
    (0, common_1.Get)("validate/:hash"),
    __param(0, (0, common_1.Param)("hash")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "validateCertificate", null);
exports.CertificatesController = CertificatesController = __decorate([
    (0, common_1.Controller)("certificates"),
    __metadata("design:paramtypes", [certificate_pdf_service_1.CertificatePdfService,
        certificate_templates_service_1.CertificateTemplatesService,
        mail_service_1.MailService,
        prisma_service_1.PrismaService])
], CertificatesController);
//# sourceMappingURL=certificates.controller.js.map