"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mail_service_1 = require("./mail.service");
const bullmq_1 = require("@nestjs/bullmq");
describe('MailService', () => {
    let service;
    const mockQueue = {
        add: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                mail_service_1.MailService,
                {
                    provide: (0, bullmq_1.getQueueToken)('emails'),
                    useValue: mockQueue,
                },
            ],
        }).compile();
        service = module.get(mail_service_1.MailService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('enqueue', () => {
        it('should add a mail job to the queue', async () => {
            const payload = {
                to: 'test@example.com',
                subject: 'Test Subject',
                text: 'Test Text',
            };
            await service.enqueue(payload);
            expect(mockQueue.add).toHaveBeenCalledWith('send', payload, expect.objectContaining({
                attempts: 3,
                backoff: expect.any(Object),
            }));
        });
    });
});
//# sourceMappingURL=mail.service.spec.js.map