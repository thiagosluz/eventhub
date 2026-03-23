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
describe('EventsController (e2e)', () => {
    let app;
    let jwtService;
    const mockPrismaService = {
        event: {
            findFirst: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        registration: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        ticket: {
            findMany: jest.fn(),
        },
    };
    const mockMinioService = {
        uploadObject: jest.fn().mockResolvedValue('http://minio/banner.png'),
    };
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrismaService)
            .overrideProvider(minio_service_1.MinioService)
            .useValue(mockMinioService)
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
    it('/events (POST) - Create Event', async () => {
        const token = await jwtService.signAsync({
            sub: 'user_1',
            email: 'org@example.com',
            tenantId: 'tenant_1',
            role: 'ORGANIZER',
        });
        const createDto = {
            name: 'E2E Event',
            slug: 'e2e-event',
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
        };
        mockPrismaService.event.findFirst.mockResolvedValue(null);
        mockPrismaService.event.create.mockResolvedValue({ id: 'event_1', ...createDto });
        return (0, supertest_1.default)(app.getHttpServer())
            .post('/events')
            .set('Authorization', `Bearer ${token}`)
            .send(createDto)
            .expect(201)
            .then((response) => {
            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(createDto.name);
        });
    });
    it('/events (GET) - List Events', async () => {
        const token = await jwtService.signAsync({
            sub: 'user_1',
            email: 'org@example.com',
            tenantId: 'tenant_1',
            role: 'ORGANIZER',
        });
        mockPrismaService.event.findMany.mockResolvedValue([
            { id: 'event_1', name: 'Event 1' },
        ]);
        return (0, supertest_1.default)(app.getHttpServer())
            .get('/events')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then((response) => {
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });
    describe('Event CRUD & Management', () => {
        it('GET /events/:id - Get Single Event', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'ORGANIZER' });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1', name: 'Event' });
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/events/e1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
        it('PATCH /events/:id - Update Event', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'ORGANIZER' });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrismaService.event.update.mockResolvedValue({ id: 'e1', name: 'Updated' });
            return (0, supertest_1.default)(app.getHttpServer())
                .patch('/events/e1')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Updated' })
                .expect(200);
        });
        it('DELETE /events/:id - Delete Event', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'ORGANIZER' });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1', status: 'DRAFT' });
            mockPrismaService.event.delete.mockResolvedValue({ id: 'e1' });
            return (0, supertest_1.default)(app.getHttpServer())
                .delete('/events/e1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
    });
    describe('Participants', () => {
        it('GET /participants - List Participants', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'ORGANIZER' });
            mockPrismaService.registration.findMany.mockResolvedValue([]);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/participants')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
        it('GET /participants/export - Export CSV', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'ORGANIZER' });
            mockPrismaService.registration.findMany.mockResolvedValue([
                { user: { name: 'U', email: 'e' }, event: { name: 'E' }, tickets: [], createdAt: new Date() }
            ]);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/participants/export')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .expect('Content-Type', /text\/csv/);
        });
    });
    describe('Public & Tickets', () => {
        it('GET /public/events - List Public Events', async () => {
            mockPrismaService.event.findMany.mockResolvedValue([]);
            return (0, supertest_1.default)(app.getHttpServer()).get('/public/events').expect(200);
        });
        it('GET /public/events/:slug - Get Public Event', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1', name: 'P' });
            return (0, supertest_1.default)(app.getHttpServer()).get('/public/events/slug').expect(200);
        });
        it('GET /my-tickets - List My Tickets', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'PARTICIPANT' });
            mockPrismaService.ticket.findMany.mockResolvedValue([]);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/my-tickets')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
    });
    describe('Banner & Logo Uploads', () => {
        it('POST /events/:id/banner - Should upload event banner', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'ORGANIZER' });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1', tenantId: 't1' });
            mockPrismaService.event.update.mockResolvedValue({ id: 'e1', bannerUrl: 'http://minio/banner.png' });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/events/e1/banner')
                .set('Authorization', `Bearer ${token}`)
                .attach('file', Buffer.from('fake image'), 'banner.png')
                .expect(201);
        });
        it('POST /events/:id/logo - Should upload event logo', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'ORGANIZER' });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1', tenantId: 't1' });
            mockPrismaService.event.update.mockResolvedValue({ id: 'e1', logoUrl: 'http://minio/logo.png' });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/events/e1/logo')
                .set('Authorization', `Bearer ${token}`)
                .attach('file', Buffer.from('fake image'), 'logo.png')
                .expect(201);
        });
    });
});
//# sourceMappingURL=events.e2e-spec.js.map