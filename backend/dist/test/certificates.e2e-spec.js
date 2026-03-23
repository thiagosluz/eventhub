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
const validPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    arrayBuffer: () => Promise.resolve(new Uint8Array(validPngBuffer).buffer),
}));
describe('Certificates (e2e)', () => {
    let app;
    let jwtService;
    const mockPrismaService = {
        event: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
        },
        certificateTemplate: {
            findFirst: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
        },
        registration: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
        },
        attendance: {
            findMany: jest.fn(),
        },
        issuedCertificate: {
            create: jest.fn(),
            findUnique: jest.fn(),
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
    describe('POST /certificates/issue', () => {
        it('should issue a certificate (Organizer)', async () => {
            const token = await jwtService.signAsync({
                sub: 'org_1',
                email: 'org@test.com',
                tenantId: 'tenant_1',
                role: 'ORGANIZER',
            });
            mockPrismaService.certificateTemplate.findFirst.mockResolvedValue({
                id: 'tmpl_1',
                eventId: 'event_1',
                backgroundUrl: 'http://test.com/bg.png',
                layoutConfig: {},
                event: { name: 'Test Event' },
            });
            mockPrismaService.registration.findFirst.mockResolvedValue({
                id: 'reg_1',
                user: { name: 'User 1' },
                event: { name: 'Test Event' },
            });
            mockPrismaService.attendance.findMany.mockResolvedValue([]);
            mockMinioService.uploadObject.mockResolvedValue('http://minio/cert.pdf');
            mockPrismaService.issuedCertificate.create.mockResolvedValue({ id: 'issued_1' });
            return (0, supertest_1.default)(app.getHttpServer())
                .post('/certificates/issue')
                .set('Authorization', `Bearer ${token}`)
                .send({
                templateId: 'tmpl_1',
                registrationId: 'reg_1',
            })
                .expect(201)
                .then((response) => {
                expect(response.body).toHaveProperty('issuedId');
                expect(response.body.fileUrl).toBe('http://minio/cert.pdf');
            });
        });
    });
    describe('GET /certificates/my', () => {
        it('should list my certificates (Participant)', async () => {
            const token = await jwtService.signAsync({
                sub: 'user_1',
                email: 'user@test.com',
                tenantId: 'tenant_1',
                role: 'PARTICIPANT',
            });
            mockPrismaService.issuedCertificate.findMany.mockResolvedValue([
                { id: 'issued_1', fileUrl: 'url', template: { name: 'T1', event: { name: 'E1' } } },
            ]);
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/certificates/my')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then((response) => {
                expect(Array.isArray(response.body)).toBe(true);
                expect(response.body[0].fileUrl).toBe('url');
            });
        });
    });
    describe('GET /certificates/validate/:hash', () => {
        it('should validate a certificate (Public)', async () => {
            mockPrismaService.issuedCertificate.findUnique.mockResolvedValue({
                id: 'issued_1',
                validationHash: 'hash_1',
                issuedAt: new Date(),
                fileUrl: 'url',
                registration: {
                    user: { name: 'User 1' },
                    event: { name: 'Event 1' },
                },
                template: {
                    event: { name: 'Event 1' },
                },
            });
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/certificates/validate/hash_1')
                .expect(200)
                .then((response) => {
                expect(response.body.isValid).toBe(true);
                expect(response.body.participantName).toBe('User 1');
            });
        });
    });
});
//# sourceMappingURL=certificates.e2e-spec.js.map