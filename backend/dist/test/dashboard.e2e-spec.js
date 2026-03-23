"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("./../src/app.module");
const prisma_service_1 = require("./../src/prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
describe('Dashboard (e2e)', () => {
    let app;
    let jwtService;
    const mockPrismaService = {
        ticket: {
            aggregate: jest.fn(),
            count: jest.fn(),
        },
        registration: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        event: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
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
        jwtService = moduleFixture.get(jwt_1.JwtService);
        await app.init();
    });
    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });
    describe('GET /dashboard/stats', () => {
        it('should return 200 and stats for Organizer', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                email: 'org@test.com',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.ticket.aggregate.mockResolvedValue({ _sum: { price: 1000 } });
            mockPrismaService.registration.count.mockResolvedValue(50);
            mockPrismaService.event.count.mockResolvedValue(5);
            mockPrismaService.ticket.count.mockResolvedValue(40);
            mockPrismaService.registration.findMany.mockResolvedValue([]);
            mockPrismaService.event.findMany.mockResolvedValue([]);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/dashboard/stats')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then((response) => {
                expect(response.body.totalRevenue).toBe(1000);
                expect(response.body.totalRegistrations).toBe(50);
            });
        });
        it('should return 403 for Participant', async () => {
            const token = await jwtService.signAsync({
                sub: 'user_1',
                email: 'user@test.com',
                tenantId: 'tenant_1',
                role: 'PARTICIPANT',
            });
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/dashboard/stats')
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
        });
    });
});
//# sourceMappingURL=dashboard.e2e-spec.js.map