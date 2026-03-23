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
describe('CheckoutController (e2e)', () => {
    let app;
    let jwtService;
    const mockPrismaService = {
        event: {
            findUnique: jest.fn(),
        },
        registration: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        activity: {
            findMany: jest.fn(),
        },
        ticket: {
            create: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        activityEnrollment: {
            createMany: jest.fn(),
        },
        customFormResponse: {
            create: jest.fn(),
        },
        customFormAnswer: {
            create: jest.fn(),
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
    it('/checkout (POST) - Success', async () => {
        const token = await jwtService.signAsync({
            sub: 'user_1',
            email: 'user@example.com',
            tenantId: 'tenant_1',
            role: 'PARTICIPANT',
        });
        const checkoutDto = {
            eventId: 'event_1',
            activityIds: [],
        };
        mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event_1', name: 'Test Event' });
        mockPrismaService.registration.findFirst.mockResolvedValue(null);
        mockPrismaService.registration.create.mockResolvedValue({ id: 'reg_1' });
        mockPrismaService.activity.findMany.mockResolvedValue([]);
        mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user_1', email: 'user@example.com' });
        mockPrismaService.ticket.create.mockResolvedValue({ id: 'ticket_1', type: 'FREE', status: 'COMPLETED' });
        return (0, supertest_1.default)(app.getHttpServer())
            .post('/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send(checkoutDto)
            .expect(201)
            .then((response) => {
            expect(response.body).toHaveProperty('registrationId');
            expect(response.body).toHaveProperty('tickets');
            expect(Array.isArray(response.body.tickets)).toBe(true);
        });
    });
    it('/checkout (POST) - Conflict (Already Registered)', async () => {
        const token = await jwtService.signAsync({
            sub: 'user_1',
            email: 'user@example.com',
            tenantId: 'tenant_1',
            role: 'PARTICIPANT',
        });
        const checkoutDto = {
            eventId: 'event_1',
        };
        mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event_1' });
        mockPrismaService.registration.findFirst.mockResolvedValue({ id: 'existing_reg' });
        return (0, supertest_1.default)(app.getHttpServer())
            .post('/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send(checkoutDto)
            .expect(409);
    });
});
//# sourceMappingURL=checkout.e2e-spec.js.map