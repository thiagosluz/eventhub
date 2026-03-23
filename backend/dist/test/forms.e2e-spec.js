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
describe('Forms (e2e)', () => {
    let app;
    let jwtService;
    const mockPrismaService = {
        event: {
            findFirst: jest.fn(),
        },
        customForm: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        customFormField: {
            findMany: jest.fn(),
            deleteMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
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
    describe('GET /events/:eventId/registration-form', () => {
        it('should return registration form for organizer', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrismaService.customForm.findFirst.mockResolvedValue({ id: 'f1', fields: [] });
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/events/e1/registration-form')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
    });
    describe('POST /events/:eventId/registration-form', () => {
        it('should save registration form for organizer', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrismaService.customForm.findFirst.mockResolvedValueOnce(null);
            mockPrismaService.customForm.create.mockResolvedValue({ id: 'f1', name: 'Reg Form' });
            mockPrismaService.customFormField.findMany.mockResolvedValue([]);
            mockPrismaService.customFormField.deleteMany.mockResolvedValue({ count: 0 });
            mockPrismaService.customFormField.create.mockResolvedValue({ id: 'ff1' });
            mockPrismaService.customForm.findFirst.mockResolvedValueOnce({ id: 'f1', fields: [] });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/events/e1/registration-form')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Reg Form', fields: [{ label: 'Email', type: 'TEXT', required: true, order: 1 }] })
                .expect(201);
        });
        it('should block participants from saving forms', async () => {
            const token = await jwtService.signAsync({
                sub: 'user_1',
                tenantId: 'tenant_1',
                role: 'PARTICIPANT',
            });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/events/e1/registration-form')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Hack' })
                .expect(403);
        });
    });
});
//# sourceMappingURL=forms.e2e-spec.js.map