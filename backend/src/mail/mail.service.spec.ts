import { Test, TestingModule } from "@nestjs/testing";
import { MailService } from "./mail.service";
import { getQueueToken } from "@nestjs/bullmq";

describe("MailService", () => {
  let service: MailService;
  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: getQueueToken("emails"),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("enqueue", () => {
    it("should add a mail job to the queue", async () => {
      const payload = {
        to: "test@example.com",
        subject: "Test Subject",
        text: "Test Text",
      };

      await service.enqueue(payload);

      expect(mockQueue.add).toHaveBeenCalledWith(
        "send",
        payload,
        expect.objectContaining({
          attempts: 3,
          backoff: expect.any(Object),
        }),
      );
    });
  });
});
