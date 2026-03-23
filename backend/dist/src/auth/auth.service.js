"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const uuid_1 = require("uuid");
let AuthService = class AuthService {
    constructor(prisma, jwtService, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }
    async registerOrganizer(input) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: input.email },
        });
        if (existingUser) {
            throw new common_1.UnauthorizedException("Email já está em uso.");
        }
        const tenant = await this.prisma.tenant.create({
            data: {
                name: input.tenantName,
                slug: input.tenantSlug,
            },
        });
        const passwordHash = await argon2.hash(input.password);
        const user = await this.prisma.user.create({
            data: {
                email: input.email,
                name: input.name,
                password: passwordHash,
                role: "ORGANIZER",
                tenantId: tenant.id,
            },
        });
        return this.createSession(user);
    }
    async registerParticipant(input) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: input.email },
        });
        if (existingUser) {
            throw new common_1.UnauthorizedException("Email já está em uso.");
        }
        const passwordHash = await argon2.hash(input.password);
        const tenant = await this.prisma.tenant.create({
            data: {
                name: `Participant ${input.name}`,
                slug: `participant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            },
        });
        const user = await this.prisma.user.create({
            data: {
                email: input.email,
                name: input.name,
                password: passwordHash,
                role: "PARTICIPANT",
                tenantId: tenant.id,
            },
        });
        return this.createSession(user);
    }
    async login(input) {
        const user = await this.prisma.user.findUnique({
            where: { email: input.email },
            include: { tenant: true },
        });
        if (!user || !(await argon2.verify(user.password, input.password))) {
            throw new common_1.UnauthorizedException("Credenciais inválidas.");
        }
        return this.createSession(user);
    }
    async refresh(refreshToken) {
        const user = await this.prisma.user.findFirst({
            where: { refreshToken },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("Token de atualização inválido.");
        }
        return this.createSession(user);
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.NotFoundException("Usuário não encontrado.");
        }
        const token = (0, uuid_1.v4)();
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: token,
                resetPasswordExpires: expires,
            },
        });
        await this.mailService.enqueue({
            to: user.email,
            subject: "Recuperação de Senha - EventHub",
            text: `Utilize o token abaixo para resetar sua senha (válido por 1 hora):\n\n${token}`,
            html: `<p>Utilize o token abaixo para resetar sua senha (válido por 1 hora):</p><h3>${token}</h3>`,
        });
    }
    async resetPassword(token, newPassword) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { gt: new Date() },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("Token inválido ou expirado.");
        }
        const passwordHash = await argon2.hash(newPassword);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: passwordHash,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });
    }
    async createSession(user) {
        const access_token = await this.generateToken(user, "15m");
        const refresh_token = await this.generateToken(user, "7d");
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refresh_token },
        });
        return {
            access_token,
            refresh_token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            },
        };
    }
    async generateToken(user, expiresIn) {
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
        };
        return this.jwtService.signAsync(payload, { expiresIn: expiresIn });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map