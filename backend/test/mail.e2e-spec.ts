import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "./../src/app.module";
import { MailService } from "./../src/mail/mail.service";
import { MailProcessor } from "./../src/mail/mail.processor";
import { Job } from "bullmq";

describe("Mail System (e2e)", () => {
  let app: INestApplication;
  let mailService: MailService;
  let mailProcessor: MailProcessor;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mailService = app.get<MailService>(MailService);
    mailProcessor = app.get<MailProcessor>(MailProcessor);
  });

  afterAll(async () => {
    await app.close();
  });

  it("should successfully enqueue and process a mail job via MailHog", async () => {
    const testMail = {
      to: "test@eventhub.local",
      subject: "E2E Test Email",
      text: "This is a test email from the E2E suite.",
    };

    // 1. Enqueue the mail
    // This adds to Redis/BullMQ. In a real E2E, we might want to wait for workers.
    // Here we will call the processor manually to verify SMTP connectivity
    await mailService.enqueue(testMail);

    // 2. Process manually to verify connection to MailHog
    const mockJob = {
      data: testMail,
    } as Job;

    // Se o MailHog não estiver rodando ou a config estiver errada, isso lançará erro
    await expect(mailProcessor.process(mockJob)).resolves.not.toThrow();
  });
});
