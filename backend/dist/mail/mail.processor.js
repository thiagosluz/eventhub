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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
exports.MailProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const nodemailer = __importStar(require("nodemailer"));
let MailProcessor = class MailProcessor extends bullmq_1.WorkerHost {
    constructor() {
        super(...arguments);
        this.transporter = null;
    }
    getTransporter() {
        var _a, _b;
        if (this.transporter) {
            return this.transporter;
        }
        const host = (_a = process.env.SMTP_HOST) !== null && _a !== void 0 ? _a : "localhost";
        const port = Number((_b = process.env.SMTP_PORT) !== null && _b !== void 0 ? _b : 1025);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            ...(user && pass ? { auth: { user, pass } } : {}),
        });
        return this.transporter;
    }
    async process(job) {
        var _a;
        const { to, subject, text, html } = job.data;
        const from = (_a = process.env.MAIL_FROM) !== null && _a !== void 0 ? _a : "noreply@eventhub.local";
        await this.getTransporter().sendMail({
            from,
            to,
            subject,
            text,
            html: html !== null && html !== void 0 ? html : text,
        });
    }
};
exports.MailProcessor = MailProcessor;
exports.MailProcessor = MailProcessor = __decorate([
    (0, bullmq_1.Processor)("emails"),
    (0, common_1.Injectable)()
], MailProcessor);
//# sourceMappingURL=mail.processor.js.map