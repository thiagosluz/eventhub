"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const speakers_service_1 = require("./speakers.service");
const prisma_service_1 = require("../prisma/prisma.service");
const minio_service_1 = require("../storage/minio.service");
const roles_types_1 = require("../auth/roles.types");
describe('SpeakersService', () => {
    let service;
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
        speakerRole: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            delete: jest.fn(),
        },
        activitySpeaker: {
            findMany: jest.fn(),
        },
        activityFeedback: {
            findMany: jest.fn(),
        },
        activityMaterial: {
            create: jest.fn(),
        }
    };
    const mockMinioService = {
        uploadObject: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                speakers_service_1.SpeakersService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: minio_service_1.MinioService, useValue: mockMinioService },
            ],
        }).compile();
        service = module.get(speakers_service_1.SpeakersService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        it('should create a speaker and upgrade user role if userId is provided', async () => {
            const dto = { name: 'John Doe', email: 'john@test.com', userId: 'u1' };
            mockPrismaService.speaker.create.mockResolvedValue({ id: 's1', ...dto });
            mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1', role: roles_types_1.UserRole.PARTICIPANT });
            const result = await service.create('t1', dto);
            expect(result.id).toBe('s1');
            expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                where: { id: 'u1' },
                data: { role: roles_types_1.UserRole.SPEAKER },
            });
        });
    });
    describe('update', () => {
        it('should downgrade user role when unlinking (userId: null)', async () => {
            const existingSpeaker = { id: 's1', userId: 'u1', tenantId: 't1' };
            mockPrismaService.speaker.findFirst.mockResolvedValue(existingSpeaker);
            mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1', role: roles_types_1.UserRole.SPEAKER });
            mockPrismaService.speaker.update.mockResolvedValue({ id: 's1', userId: null });
            await service.update('t1', 's1', { userId: null });
            expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                where: { id: 'u1' },
                data: { role: roles_types_1.UserRole.PARTICIPANT },
            });
        });
        it('should sync profile data to linked user', async () => {
            const existingSpeaker = { id: 's1', userId: 'u1', tenantId: 't1' };
            mockPrismaService.speaker.findFirst.mockResolvedValue(existingSpeaker);
            mockPrismaService.speaker.update.mockResolvedValue({ id: 's1', userId: 'u1' });
            await service.update('t1', 's1', { name: 'New Name', bio: 'New Bio' });
            expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                where: { id: 'u1' },
                data: { name: 'New Name', bio: 'New Bio' },
            });
        });
    });
    describe('Speaker Portal', () => {
        it('should find activities for a speaker', async () => {
            mockPrismaService.activitySpeaker.findMany.mockResolvedValue([{ id: 'as1' }]);
            const result = await service.findActivities('s1');
            expect(result).toHaveLength(1);
        });
        it('should add material to an activity', async () => {
            mockPrismaService.activityMaterial.create.mockResolvedValue({ id: 'm1' });
            const result = await service.addMaterial('a1', { title: 'Slides', fileUrl: 'http://slides.com' });
            expect(result.id).toBe('m1');
        });
    });
});
//# sourceMappingURL=speakers.service.spec.js.map