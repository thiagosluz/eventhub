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
        }),
      );
    });
  });
});
