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
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const roles_types_1 = require("../auth/roles.types");
const certificate_pdf_service_1 = require("./certificate-pdf.service");
const mail_service_1 = require("../mail/mail.service");
const prisma_service_1 = require("../prisma/prisma.service");
let CertificatesController = class CertificatesController {
    constructor(certificatePdf, mail, prisma) {
        this.certificatePdf = certificatePdf;
        this.mail = mail;
        this.prisma = prisma;
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
                    subject: 'Seu certificado está pronto',
                    text: `Acesse seu certificado em: ${fileUrl}`,
                    html: `<p>Acesse seu certificado em: <a href="${fileUrl}">${fileUrl}</a></p>`,
                });
            }
        }
        return { issuedId, fileUrl };
    }
};
exports.CertificatesController = CertificatesController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)('certificates/issue'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "issueCertificate", null);
exports.CertificatesController = CertificatesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [certificate_pdf_service_1.CertificatePdfService,
        mail_service_1.MailService,
        prisma_service_1.PrismaService])
], CertificatesController);
//# sourceMappingURL=certificates.controller.js.map