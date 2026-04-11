import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "./../src/app.module";
import { MailService } from "./../src/mail/mail.service";
import { MailProcessor } from "./../src/mail/mail.processor";
import { ActivitiesProcessor } from "./../src/activities/activities.processor";
import { AssignReviewsProcessor } from "./../src/submissions/submissions.processor";
import { KanbanAlertsProcessor } from "./../src/kanban/kanban.processor";
import { getQueueToken } from "@nestjs/bullmq";

describe("Mail System (e2e)", () => {
  let app: INestApplication;
  let mailService: MailService;

  const mockQueue = { add: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getQueueToken("activities"))
      .useValue(mockQueue)
      .overrideProvider(getQueueToken("assign-reviews"))
      .useValue(mockQueue)
      .overrideProvider(getQueueToken("emails"))
      .useValue(mockQueue)
      .overrideProvider(getQueueToken("kanban-alerts"))
      .useValue(mockQueue)
      .overrideProvider(ActivitiesProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(AssignReviewsProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(MailProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(KanbanAlertsProcessor)
      .useValue({ process: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mailService = app.get<MailService>(MailService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("should successfully enqueue a mail job", async () => {
    const testMail = {
      to: "test@eventhub.local",
      subject: "E2E Test Email",
      text: "This is a test email from the E2E suite.",
    };

    // 1. Enqueue the mail
    // Since mockQueue.add is a mock, this just verifies the service calls it.
    await mailService.enqueue(testMail);

    expect(mockQueue.add).toHaveBeenCalled();
  });
});
