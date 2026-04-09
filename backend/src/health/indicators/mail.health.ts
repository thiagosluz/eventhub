import { Injectable } from "@nestjs/common";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from "@nestjs/terminus";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const host = process.env.SMTP_HOST ?? "localhost";
      const port = Number(process.env.SMTP_PORT ?? 1025);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        ...(user && pass ? { auth: { user, pass } } : {}),
      });

      await transporter.verify();
      return this.getStatus(key, true);
    } catch (error: any) {
      throw new HealthCheckError(
        "Email health check failed",
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
