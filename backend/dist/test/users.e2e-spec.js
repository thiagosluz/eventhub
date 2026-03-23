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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("./../src/app.module");
const prisma_service_1 = require("./../src/prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const activities_processor_1 = require("./../src/activities/activities.processor");
const submissions_processor_1 = require("./../src/submissions/submissions.processor");
const mail_processor_1 = require("./../src/mail/mail.processor");
const bullmq_1 = require("@nestjs/bullmq");
const minio_service_1 = require("./../src/storage/minio.service");
const badges_service_1 = require("./../src/badges/badges.service");
const argon2 = __importStar(require("argon2"));
describe('Users (e2e)', () => {
    let app;
    let jwtService;
    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
        },
        speaker: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        badge: {
            findMany: jest.fn(),
        },
        userBadge: {
            findUnique: jest.fn(),
        }
    };
    const mockMinioService = {
        uploadObject: jest.fn().mockResolvedValue('http://minio/avatar'),
    };
    const mockBadgesService = {
        checkAndAwardBadge: jest.fn().mockResolvedValue(undefined),
    };
    const mockQueue = { add: jest.fn() };
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrismaService)
            .overrideProvider(minio_service_1.MinioService).useValue(mockMinioService)
            .overrideProvider(badges_service_1.BadgesService).useValue(mockBadgesService)
            .overrideProvider((0, bullmq_1.getQueueToken)('activities')).useValue(mockQueue)
            .overrideProvider((0, bullmq_1.getQueueToken)('assign-reviews')).useValue(mockQueue)
            .overrideProvider((0, bullmq_1.getQueueToken)('emails')).useValue(mockQueue)
            .overrideProvider(activities_processor_1.ActivitiesProcessor).useValue({ process: jest.fn() })
            .overrideProvider(submissions_processor_1.AssignReviewsProcessor).useValue({ process: jest.fn() })
            .overrideProvider(mail_processor_1.MailProcessor).useValue({ process: jest.fn() })
            .compile();
        app = moduleFixture.createNestApplication();
        jwtService = moduleFixture.get(jwt_1.JwtService);
        await app.init();
    });
    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });
    describe('GET /users/me', () => {
        it('should return current user profile', async () => {
            const token = await jwtService.signAsync({
                sub: 'user_1',
                email: 'user@test.com',
                tenantId: 'tenant_1',
                role: 'PARTICIPANT',
            });
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user_1',
                email: 'user@test.com',
                name: 'Test User',
            });
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/users/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then((response) => {
                expect(response.body.email).toBe('user@test.com');
            });
        });
    });
    describe('PATCH /users/me', () => {
        it('should update profile', async () => {
            const token = await jwtService.signAsync({
                sub: 'user_1',
                email: 'user@test.com',
                tenantId: 'tenant_1',
                role: 'PARTICIPANT',
            });
            mockPrismaService.user.findFirst.mockResolvedValue(null);
            mockPrismaService.user.update.mockResolvedValue({ id: 'user_1', name: 'New Name' });
            mockPrismaService.speaker.findUnique.mockResolvedValue(null);
            mockPrismaService.badge.findMany.mockResolvedValue([]);
            return (0, supertest_1.default)(app.getHttpServer())
                .patch('/users/me')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'New Name' })
                .expect(200);
        });
    });
    describe('GET /users (Organizer only)', () => {
        it('should list users for organizer', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.user.findMany.mockResolvedValue([]);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
        it('should block participants', async () => {
            const token = await jwtService.signAsync({
                sub: 'user_1',
                tenantId: 'tenant_1',
                role: 'PARTICIPANT',
            });
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
        });
    });
    describe('Password & Avatar', () => {
        it('should update password', async () => {
            const token = await jwtService.signAsync({
                sub: 'user_1',
                tenantId: 'tenant_1',
                role: 'PARTICIPANT',
            });
            const currentPasswordHash = await argon2.hash('old');
            mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user_1', password: currentPasswordHash });
            mockPrismaService.user.update.mockResolvedValue({ id: 'user_1' });
            return (0, supertest_1.default)(app.getHttpServer())
                .patch('/users/me/password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'old', newPassword: 'new' })
                .expect(200);
        });
        it('should upload avatar', async () => {
            const token = await jwtService.signAsync({
                sub: 'user_1',
                tenantId: 'tenant_1',
                role: 'PARTICIPANT',
            });
            mockPrismaService.user.update.mockResolvedValue({ id: 'user_1', avatarUrl: 'http://minio/avatar' });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/users/me/avatar')
                .set('Authorization', `Bearer ${token}`)
                .attach('file', Buffer.from('image content'), 'avatar.png')
                .expect(201);
        });
    });
});
//# sourceMappingURL=users.e2e-spec.js.map