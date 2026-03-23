"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const mail_processor_1 = require("./mail.processor");
const nodemailer = __importStar(require("nodemailer"));
jest.mock('nodemailer');
describe('MailProcessor', () => {
    let processor;
    const mockSendMail = jest.fn().mockResolvedValue({ messageId: '123' });
    nodemailer.createTransport.mockReturnValue({
        sendMail: mockSendMail,
    });
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [mail_processor_1.MailProcessor],
        }).compile();
        processor = module.get(mail_processor_1.MailProcessor);
    });
    it('should be defined', () => {
        expect(processor).toBeDefined();
    });
    describe('process', () => {
        it('should send an email using nodemailer', async () => {
            const job = {
                data: {
                    to: 'recipient@test.com',
                    subject: 'Hello',
                    text: 'Body',
                },
            };
            await processor.process(job);
            expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'recipient@test.com',
                subject: 'Hello',
                text: 'Body',
            }));
        });
    });
});
//# sourceMappingURL=mail.processor.spec.js.map