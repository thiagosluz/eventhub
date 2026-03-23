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
const minio_service_1 = require("./../src/storage/minio.service");
const mail_service_1 = require("./../src/mail/mail.service");
const bullmq_1 = require("@nestjs/bullmq");
const submissions_processor_1 = require("./../src/submissions/submissions.processor");
describe('Submissions (e2e)', () => {
    let app;
    let jwtService;
    const mockPrismaService = {
        event: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
        submission: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        review: {
            findFirst: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    };
    const mockMinioService = {
        uploadObject: jest.fn(),
    };
    const mockMailService = {
        enqueue: jest.fn(),
    };
    const mockQueue = {
        add: jest.fn(),
    };
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrismaService)
            .overrideProvider(minio_service_1.MinioService)
            .useValue(mockMinioService)
            .overrideProvider(mail_service_1.MailService)
            .useValue(mockMailService)
            .overrideProvider((0, bullmq_1.getQueueToken)('assign-reviews'))
            .useValue(mockQueue)
            .overrideProvider(submissions_processor_1.AssignReviewsProcessor)
            .useValue({})
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
    describe('POST /submissions', () => {
        it('should create a submission (Participant)', async () => {
            const token = await jwtService.signAsync({
                sub: 'author_1',
                email: 'author@test.com',
                tenantId: 'tenant_1',
                role: 'PARTICIPANT',
            });
            mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event_1', tenantId: 'tenant_1' });
            mockMinioService.uploadObject.mockResolvedValue('http://minio/file');
            mockPrismaService.submission.create.mockResolvedValue({
                id: 'sub_1',
                title: 'My Paper',
                author: { name: 'Author', email: 'author@test.com' },
                event: { name: 'Event' },
            });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/submissions')
                .set('Authorization', `Bearer ${token}`)
                .field('eventId', 'event_1')
                .field('title', 'My Paper')
                .attach('file', Buffer.from('pdf content'), 'paper.pdf')
                .expect(201)
                .then((response) => {
                expect(response.body.id).toBe('sub_1');
                expect(mockQueue.add).toHaveBeenCalled();
            });
        });
    });
    describe('GET /events/:id/submissions', () => {
        it('should list submissions (Organizer)', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                email: 'org@test.com',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'event_1' });
            mockPrismaService.submission.findMany.mockResolvedValue([
                { id: 'sub_1', title: 'Sub 1', reviews: [] },
            ]);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/events/event_1/submissions')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then((response) => {
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body[0].title).toBe('Sub 1');
            });
        });
    });
    describe('POST /reviews', () => {
        it('should submit a review (Reviewer)', async () => {
            const token = await jwtService.signAsync({
                sub: 'rev_1',
                email: 'rev@test.com',
                tenantId: 'tenant_1',
                role: 'REVIEWER',
            });
            mockPrismaService.review.findFirst.mockResolvedValue({ id: 'rev_rec_1' });
            mockPrismaService.review.update.mockResolvedValue({ id: 'rev_rec_1', score: 4 });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/reviews')
                .set('Authorization', `Bearer ${token}`)
                .send({
                submissionId: 'sub_1',
                score: 4,
                recommendation: 'ACCEPT',
                comments: 'Great work!',
            })
                .expect(201);
        });
    });
    describe('My Submissions & Reviews', () => {
        it('should list my assigned reviews (Reviewer)', async () => {
            const token = await jwtService.signAsync({
                sub: 'rev_1',
                tenantId: 'tenant_1',
                role: 'REVIEWER',
            });
            mockPrismaService.review.findMany.mockResolvedValue([]);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/me/reviews')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
        it('should list my submissions (Author)', async () => {
            const token = await jwtService.signAsync({
                sub: 'author_1',
                tenantId: 'tenant_1',
                role: 'PARTICIPANT',
            });
            mockPrismaService.submission.findMany.mockResolvedValue([]);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/me/submissions')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
    });
});
//# sourceMappingURL=submissions.e2e-spec.js.map