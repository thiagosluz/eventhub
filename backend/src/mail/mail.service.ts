import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

export interface SendMailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class MailService {
  constructor(@InjectQueue("emails") private readonly emailQueue: Queue) {}

  async enqueue(payload: SendMailPayload): Promise<void> {
    await this.emailQueue.add("send", payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    });
  }
}
