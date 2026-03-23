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
const badges_service_1 = require("./../src/badges/badges.service");
const mail_service_1 = require("./../src/mail/mail.service");
describe('Checkin (e2e)', () => {
    let app;
    let jwtService;
    const mockPrismaService = {
        ticket: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        activity: {
            findUnique: jest.fn(),
        },
        activityEnrollment: {
            findFirst: jest.fn(),
        },
        attendance: {
            findFirst: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
        event: {
            findFirst: jest.fn(),
        },
        raffleHistory: {
            findMany: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    };
    const mockBadgesService = {
        checkAndAwardBadge: jest.fn(),
    };
    const mockMailService = {
        enqueue: jest.fn(),
    };
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrismaService)
            .overrideProvider(badges_service_1.BadgesService)
            .useValue(mockBadgesService)
            .overrideProvider(mail_service_1.MailService)
            .useValue(mockMailService)
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
    describe('GET /tickets/:id/qrcode', () => {
        it('should return 200 and PNG for owner', async () => {
            const token = await jwtService.signAsync({
                sub: 'user_1',
                email: 'user@test.com',
                tenantId: 'tenant_1',
                role: 'PARTICIPANT',
            });
            mockPrismaService.ticket.findFirst.mockResolvedValue({
                id: 't1',
                qrCodeToken: 'token',
                registration: { userId: 'user_1' },
            });
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/tickets/t1/qrcode')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .expect('Content-Type', /image\/png/);
        });
    });
    describe('Check-in Flow', () => {
        it('POST /checkin - should perform check-in successfully', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.ticket.findUnique.mockResolvedValue({
                id: 't1',
                eventId: 'e1',
                registrationId: 'r1',
                attendances: [],
            });
            mockPrismaService.attendance.findFirst.mockResolvedValue(null);
            mockPrismaService.attendance.create.mockResolvedValue({
                id: 'att1',
                ticket: {
                    registration: {
                        user: { id: 'u1', name: 'User', email: 'user@example.com' },
                        event: { id: 'e1', name: 'Event' },
                    },
                },
            });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/checkin')
                .set('Authorization', `Bearer ${token}`)
                .send({ qrCodeToken: 'valid_token' })
                .expect(201);
        });
        it('DELETE /checkin/:id - should undo a check-in', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.attendance.findUnique.mockResolvedValue({ id: 'att1' });
            mockPrismaService.attendance.delete.mockResolvedValue({ id: 'att1' });
            return (0, supertest_1.default)(app.getHttpServer())
                .delete('/checkin/att1')
                .set('Authorization', `Bearer ${token}`)
                .expect(204);
        });
    });
    describe('Raffles', () => {
        it('POST /raffles - should draw a raffle winner', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrismaService.attendance.findMany.mockResolvedValue([
                { ticket: { registration: { id: 'reg1', user: { name: 'Winner', role: 'PARTICIPANT' } } } },
            ]);
            mockPrismaService.raffleHistory.create.mockResolvedValue({ id: 'h1' });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/raffles')
                .set('Authorization', `Bearer ${token}`)
                .send({ eventId: 'e1', count: 1 })
                .expect(201);
        });
        it('GET /raffles/latest/:eventId - should get latest raffle', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'ORGANIZER' });
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrismaService.raffleHistory.findMany.mockResolvedValue([{ id: 'h1', registration: { user: { name: 'W' } }, activity: null }]);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/raffles/latest/e1')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
        });
        it('POST /raffles/history/:id/hide - should toggle raffle visibility', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'ORGANIZER' });
            mockPrismaService.raffleHistory.findUnique.mockResolvedValue({
                id: 'h1',
                event: { tenantId: 't1' },
            });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/raffles/history/h1/hide')
                .set('Authorization', `Bearer ${token}`)
                .send({ hide: true })
                .expect(201);
        });
        it('POST /raffles/history/:id/receive - should mark prize as received', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'ORGANIZER' });
            mockPrismaService.raffleHistory.findUnique.mockResolvedValue({
                id: 'h1',
                eventId: 'e1',
                registration: { userId: 'u1' },
                event: { tenantId: 't1' },
            });
            mockPrismaService.raffleHistory.update.mockResolvedValue({ id: 'h1', hasReceived: true });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/raffles/history/h1/receive')
                .set('Authorization', `Bearer ${token}`)
                .send({ received: true })
                .expect(201);
        });
        it('DELETE /raffles/history/:id - should delete raffle history', async () => {
            const token = await jwtService.signAsync({ sub: 'u1', tenantId: 't1', role: 'ORGANIZER' });
            mockPrismaService.raffleHistory.findUnique.mockResolvedValue({
                id: 'h1',
                event: { tenantId: 't1' },
            });
            mockPrismaService.raffleHistory.delete.mockResolvedValue({ id: 'h1' });
            return (0, supertest_1.default)(app.getHttpServer())
                .delete('/raffles/history/h1')
                .set('Authorization', `Bearer ${token}`)
                .expect(204);
        });
    });
});
//# sourceMappingURL=checkin.e2e-spec.js.map