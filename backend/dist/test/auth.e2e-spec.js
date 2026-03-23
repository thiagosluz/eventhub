"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("./../src/app.module");
const prisma_service_1 = require("./../src/prisma/prisma.service");
describe('AuthController (e2e)', () => {
    let app;
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
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrismaService)
            .compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });
    it('/auth/register-organizer (POST)', () => {
        const registerDto = {
            tenantName: 'Test Tenant',
            tenantSlug: 'test-tenant',
            name: 'Organizer',
            email: 'org@example.com',
            password: 'password123',
        };
        mockPrismaService.user.findUnique.mockResolvedValue(null);
        mockPrismaService.tenant.create.mockResolvedValue({ id: 'tenant_1' });
        mockPrismaService.user.create.mockResolvedValue({
            id: 'user_1',
            ...registerDto,
            role: 'ORGANIZER',
            tenantId: 'tenant_1',
        });
        mockPrismaService.user.update.mockResolvedValue({ id: 'user_1' });
        return (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/register-organizer')
            .send(registerDto)
            .expect(201)
            .then((response) => {
            expect(response.body).toHaveProperty('access_token');
            expect(response.body.user.email).toBe(registerDto.email);
        });
    });
    it('/auth/login (POST)', () => {
    });
});
//# sourceMappingURL=auth.e2e-spec.js.map