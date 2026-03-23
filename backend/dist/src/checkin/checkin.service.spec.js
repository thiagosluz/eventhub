"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const checkin_service_1 = require("./checkin.service");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const badges_service_1 = require("../badges/badges.service");
const common_1 = require("@nestjs/common");
describe('CheckinService', () => {
    let service;
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
            findMany: jest.fn(),
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
            delete: jest.fn(),
            update: jest.fn(),
        },
    };
    const mockMailService = {
        enqueue: jest.fn(),
    };
    const mockBadgesService = {
        checkAndAwardBadge: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                checkin_service_1.CheckinService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: mail_service_1.MailService, useValue: mockMailService },
                { provide: badges_service_1.BadgesService, useValue: mockBadgesService },
            ],
        }).compile();
        service = module.get(checkin_service_1.CheckinService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getQrCodePng', () => {
        it('should throw NotFoundException if ticket not found', async () => {
            mockPrismaService.ticket.findFirst.mockResolvedValue(null);
            await expect(service.getQrCodePng('t1', 'u1')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw ForbiddenException if ticket belongs to another user', async () => {
            mockPrismaService.ticket.findFirst.mockResolvedValue({ registration: { userId: 'u2' } });
            await expect(service.getQrCodePng('t1', 'u1')).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should return QR Code buffer successfully', async () => {
            mockPrismaService.ticket.findFirst.mockResolvedValue({
                id: 't1',
                qrCodeToken: 'token',
                registration: { userId: 'u1' },
            });
            const result = await service.getQrCodePng('t1', 'u1');
            expect(result).toBeInstanceOf(Buffer);
        });
    });
    describe('checkin', () => {
        it('should throw NotFoundException if ticket is invalid', async () => {
            mockPrismaService.ticket.findUnique.mockResolvedValue(null);
            await expect(service.checkin({ qrCodeToken: 'invalid' })).rejects.toThrow(common_1.NotFoundException);
        });
        it('should perform checkin successfully', async () => {
            mockPrismaService.ticket.findUnique.mockResolvedValue({ id: 't1', eventId: 'e1' });
            mockPrismaService.attendance.findFirst.mockResolvedValue(null);
            mockPrismaService.attendance.create.mockResolvedValue({
                id: 'att1',
                ticket: {
                    registration: {
                        user: { id: 'u1', name: 'User', email: 'u@t.com' },
                        event: { id: 'e1', name: 'Event' },
                    },
                },
            });
            const result = await service.checkin({ qrCodeToken: 'token' });
            expect(result.alreadyCheckedIn).toBe(false);
            expect(mockMailService.enqueue).toHaveBeenCalled();
            expect(mockBadgesService.checkAndAwardBadge).toHaveBeenCalled();
        });
        it('should return alreadyCheckedIn true if attendance exists', async () => {
            mockPrismaService.ticket.findUnique.mockResolvedValue({ id: 't1' });
            mockPrismaService.attendance.findFirst.mockResolvedValue({ id: 'att1' });
            const result = await service.checkin({ qrCodeToken: 'token' });
            expect(result.alreadyCheckedIn).toBe(true);
            expect(mockPrismaService.attendance.create).not.toHaveBeenCalled();
        });
    });
    describe('drawRaffle', () => {
        it('should throw ForbiddenException if event not in tenant', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue(null);
            await expect(service.drawRaffle({ tenantId: 't1', eventId: 'e1' })).rejects.toThrow(common_1.ForbiddenException);
        });
        it('should draw a winner successfully', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrismaService.attendance.findMany.mockResolvedValue([
                { ticket: { registration: { id: 'reg1', user: { name: 'Winner', role: 'PARTICIPANT' } } } },
            ]);
            mockPrismaService.raffleHistory.create.mockResolvedValue({ id: 'h1' });
            const result = await service.drawRaffle({ tenantId: 't1', eventId: 'e1', count: 1 });
            expect(result.winners).toHaveLength(1);
            expect(result.winners[0].userName).toBe('Winner');
            expect(mockPrismaService.raffleHistory.create).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=checkin.service.spec.js.map