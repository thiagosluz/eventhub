import { Test, TestingModule } from "@nestjs/testing";
import { MailProcessor } from "./mail.processor";
import * as nodemailer from "nodemailer";
import { Job } from "bullmq";

jest.mock("nodemailer");

describe("MailProcessor", () => {
  let processor: MailProcessor;
  const mockSendMail = jest.fn().mockResolvedValue({ messageId: "123" });

  (nodemailer.createTransport as jest.Mock).mockReturnValue({
    sendMail: mockSendMail,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailProcessor],
    }).compile();

    processor = module.get<MailProcessor>(MailProcessor);
  });

  it("should be defined", () => {
    expect(processor).toBeDefined();
  });

  describe("process", () => {
    it("should send an email using nodemailer", async () => {
      const job = {
        data: {
          to: "recipient@test.com",
          subject: "Hello",
          text: "Body",
        },
      } as Job;

      await processor.process(job);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "recipient@test.com",
          subject: "Hello",
          text: "Body",
          from: "noreply@eventhub.local",
          html: "Body",
        }),
      );
    });

    it("should use html if provided in job data", async () => {
      const job = {
        data: {
          to: "recipient@test.com",
          subject: "Hello",
          text: "Body",
          html: "<h1>Body</h1>",
        },
      } as Job;

      await processor.process(job);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: "<h1>Body</h1>",
        }),
      );
    });

    it("should use MAIL_FROM from environment", async () => {
      process.env.MAIL_FROM = "custom@test.com";
      const job = {
        data: { to: "t@t.com", subject: "S", text: "T" },
      } as Job;

      await processor.process(job);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ from: "custom@test.com" }),
      );
      delete process.env.MAIL_FROM;
    });
  });

  describe("getTransporter", () => {
    it("should cache the transporter instance", () => {
      const t1 = (processor as any).getTransporter();
      const t2 = (processor as any).getTransporter();
      expect(t1).toBe(t2);
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    });

    it("should use custom SMTP environment variables", () => {
      // Create a fresh instance for this test to avoid cached transporter
      const freshProcessor = new MailProcessor();
      process.env.SMTP_HOST = "smtp.custom.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "user";
      process.env.SMTP_PASS = "pass";

      (freshProcessor as any).getTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "smtp.custom.com",
          port: 465,
          secure: true,
          auth: { user: "user", pass: "pass" },
        }),
      );

      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
    });
  });
});
