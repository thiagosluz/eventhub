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
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const mail_service_1 = require("../mail/mail.service");
const argon2 = __importStar(require("argon2"));
jest.mock('argon2');
describe('AuthService', () => {
    let service;
    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        tenant: {
            create: jest.fn(),
        },
    };
    const mockJwtService = {
        signAsync: jest.fn(),
    };
    const mockMailService = {
        enqueue: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: jwt_1.JwtService, useValue: mockJwtService },
                { provide: mail_service_1.MailService, useValue: mockMailService },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('login', () => {
        it('should throw UnauthorizedException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            await expect(service.login({ email: 'test@example.com', password: 'password' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw UnauthorizedException if password does not match', async () => {
            const user = { email: 'test@example.com', password: 'hashed_password' };
            mockPrismaService.user.findUnique.mockResolvedValue(user);
            argon2.verify.mockResolvedValue(false);
            await expect(service.login({ email: 'test@example.com', password: 'password' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should return access_token if credentials are valid', async () => {
            const user = {
                id: 'user_id',
                email: 'test@example.com',
                password: 'hashed_password',
                role: 'ORGANIZER',
                tenantId: 'tenant_id',
            };
            mockPrismaService.user.findUnique.mockResolvedValue(user);
            argon2.verify.mockResolvedValue(true);
            mockJwtService.signAsync.mockResolvedValue('token');
            const result = await service.login({
                email: 'test@example.com',
                password: 'password',
            });
            expect(result).toEqual({
                access_token: 'token',
                refresh_token: 'token',
                user: {
                    id: user.id,
                    name: undefined,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenantId,
                },
            });
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map