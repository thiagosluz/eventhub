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
describe('Security (e2e) - Multi-Tenancy Isolation', () => {
    let app;
    let jwtService;
    const mockPrismaService = {
        event: {
            findFirst: jest.fn(),
        },
        activity: {
            findFirst: jest.fn(),
        },
        submission: {
            findFirst: jest.fn(),
        },
        registration: {
            findFirst: jest.fn(),
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
    describe('Cross-Tenant Data Isolation', () => {
        it('should block Organizer from accessing another tenant\'s event activities', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_A',
                role: 'ORGANIZER',
            });
            mockPrismaService.event.findFirst.mockResolvedValue(null);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/events/event_of_tenant_B/activities')
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
        });
        it('should block Organizer from updating another tenant\'s activity', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_A',
                role: 'ORGANIZER',
            });
            mockPrismaService.activity.findFirst.mockResolvedValue(null);
            return (0, supertest_1.default)(app.getHttpServer())
                .patch('/activities/activity_of_tenant_B')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Hack' })
                .expect(404);
        });
        it('should block Organizer from listing submissions of another tenant\'s event', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_A',
                role: 'ORGANIZER',
            });
            mockPrismaService.event.findFirst.mockResolvedValue(null);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/events/event_of_tenant_B/submissions')
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
        });
    });
});
//# sourceMappingURL=security.e2e-spec.js.map