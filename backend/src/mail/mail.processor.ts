import { Injectable } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

@Processor("emails")
@Injectable()
export class MailProcessor extends WorkerHost {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }
    const host = process.env.SMTP_HOST ?? "localhost";
    const port = Number(process.env.SMTP_PORT ?? 1025);
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

  async process(
    job: Job<{ to: string; subject: string; text: string; html?: string }>,
  ): Promise<void> {
    const { to, subject, text, html } = job.data;
    const from = process.env.MAIL_FROM ?? "noreply@eventhub.local";
    await this.getTransporter().sendMail({
      from,
      to,
      subject,
      text,
      html: html ?? text,
    });
  }
}
