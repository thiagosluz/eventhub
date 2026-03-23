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
describe('Speakers (e2e)', () => {
    let app;
    let jwtService;
    const mockPrismaService = {
        speaker: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        activitySpeaker: {
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
    describe('POST /speakers', () => {
        it('should create a speaker (Organizer)', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.speaker.create.mockResolvedValue({ id: 's1', name: 'Speaker' });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/speakers')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Speaker', email: 'speaker@test.com' })
                .expect(201);
        });
    });
    describe('GET /speakers/me', () => {
        it('should return my speaker profile', async () => {
            const token = await jwtService.signAsync({
                sub: 'user_1',
                tenantId: 'tenant_1',
                role: 'SPEAKER',
            });
            mockPrismaService.speaker.findUnique.mockResolvedValue({ id: 's1', name: 'My Profile' });
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/speakers/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then((response) => {
                expect(response.body.name).toBe('My Profile');
            });
        });
    });
});
//# sourceMappingURL=speakers.e2e-spec.js.map