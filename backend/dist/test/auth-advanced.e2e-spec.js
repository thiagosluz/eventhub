"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
const mail_service_1 = require("../src/mail/mail.service");
describe('Auth Advanced (e2e)', () => {
    let app;
    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
        tenant: {
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
    };
    const mockMailService = {
        enqueue: jest.fn(),
    };
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrismaService)
            .overrideProvider(mail_service_1.MailService)
            .useValue(mockMailService)
            .compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe());
        await app.init();
    });
    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });
    describe('Token Rotation & Sessions', () => {
        it('should register, login, and rotate refresh tokens', async () => {
            const email = 'tester@example.com';
            const password = 'password123';
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.tenant.create.mockResolvedValue({ id: 't1' });
            mockPrismaService.user.create.mockResolvedValue({
                id: 'u1',
                email,
                name: 'Tester',
                role: 'ORGANIZER',
                tenantId: 't1',
            });
            mockPrismaService.user.update.mockResolvedValue({ id: 'u1' });
            const regRes = await (0, supertest_1.default)(app.getHttpServer())
                .post('/auth/register-organizer')
                .send({
                tenantName: 'Test Org',
                tenantSlug: 'test-org',
                name: 'Tester',
                email,
                password,
            })
                .expect(201);
            expect(regRes.body.access_token).toBeDefined();
            expect(regRes.body.refresh_token).toBeDefined();
            const firstRefreshToken = regRes.body.refresh_token;
            mockPrismaService.user.findFirst.mockResolvedValue({
                id: 'u1',
                email,
                role: 'ORGANIZER',
                tenantId: 't1',
            });
            mockPrismaService.user.update.mockResolvedValue({ id: 'u1' });
            const refreshRes = await (0, supertest_1.default)(app.getHttpServer())
                .post('/auth/refresh')
                .send({ refresh_token: firstRefreshToken })
                .expect(201);
            expect(refreshRes.body.access_token).toBeDefined();
            expect(refreshRes.body.refresh_token).toBeDefined();
            const secondRefreshToken = refreshRes.body.refresh_token;
            mockPrismaService.user.update.mockResolvedValue({ id: 'u1', refreshToken: null });
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/auth/logout')
                .set('Authorization', `Bearer ${refreshRes.body.access_token}`)
                .expect(201);
            mockPrismaService.user.findFirst.mockResolvedValue(null);
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/auth/refresh')
                .send({ refresh_token: secondRefreshToken })
                .expect(401);
        });
    });
    describe('Password Recovery', () => {
        it('should handle password recovery flow', async () => {
            const email = 'recover@example.com';
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'u2',
                email,
                name: 'Recover Tester',
            });
            mockPrismaService.user.update.mockResolvedValue({ id: 'u2' });
            mockMailService.enqueue.mockResolvedValue(undefined);
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/auth/forgot-password')
                .send({ email })
                .expect(201);
            mockPrismaService.user.findFirst.mockResolvedValue({
                id: 'u2',
                email,
            });
            mockPrismaService.user.update.mockResolvedValue({ id: 'u2' });
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/auth/reset-password')
                .send({
                token: 'valid_reset_token',
                newPassword: 'newpassword123',
            })
                .expect(201);
        });
    });
});
//# sourceMappingURL=auth-advanced.e2e-spec.js.map