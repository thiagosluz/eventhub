"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const forms_service_1 = require("./forms.service");
const prisma_service_1 = require("../prisma/prisma.service");
describe('FormsService', () => {
    let service;
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
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                forms_service_1.FormsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(forms_service_1.FormsService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getRegistrationForm', () => {
        it('should return form with fields', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrismaService.customForm.findFirst.mockResolvedValue({ id: 'f1', fields: [] });
            const result = await service.getRegistrationForm('t1', 'e1');
            expect(result === null || result === void 0 ? void 0 : result.id).toBe('f1');
        });
    });
    describe('saveRegistrationForm', () => {
        it('should create form if not exists and upsert fields', async () => {
            mockPrismaService.event.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrismaService.customForm.findFirst.mockResolvedValue(null);
            mockPrismaService.customForm.create.mockResolvedValue({ id: 'f1', name: 'Form' });
            mockPrismaService.customFormField.findMany.mockResolvedValue([]);
            await service.saveRegistrationForm('t1', 'e1', {
                name: 'Form',
                fields: [{ label: 'Age', type: 'NUMBER', required: true, order: 1 }]
            });
            expect(mockPrismaService.customForm.create).toHaveBeenCalled();
            expect(mockPrismaService.customFormField.create).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=forms.service.spec.js.map