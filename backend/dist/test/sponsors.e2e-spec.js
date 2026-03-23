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
const activities_processor_1 = require("./../src/activities/activities.processor");
const submissions_processor_1 = require("./../src/submissions/submissions.processor");
const mail_processor_1 = require("./../src/mail/mail.processor");
const bullmq_1 = require("@nestjs/bullmq");
describe('Sponsors (e2e)', () => {
    let app;
    let jwtService;
    const mockPrismaService = {
        event: {
            findFirst: jest.fn(),
        },
        sponsorCategory: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        sponsor: {
            findMany: jest.fn(),
        }
    };
    const mockQueue = { add: jest.fn() };
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrismaService)
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
    describe('POST /events/:id/sponsors/categories', () => {
        it('should create a sponsor category (Organizer)', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrismaService.sponsorCategory.create.mockResolvedValue({ id: 'c1', name: 'Gold' });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/sponsors/categories/e1')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Gold' })
                .expect(201);
        });
    });
    describe('GET /events/:id/sponsors/categories', () => {
        it('should list categories', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrismaService.sponsorCategory.findMany.mockResolvedValue([]);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/sponsors/categories/e1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
    });
});
//# sourceMappingURL=sponsors.e2e-spec.js.map