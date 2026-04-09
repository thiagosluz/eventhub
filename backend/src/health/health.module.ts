import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller";
import { MailHealthIndicator } from "./indicators/mail.health";
import { MinioHealthIndicator } from "./indicators/minio.health";
import { StorageModule } from "../storage/storage.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [TerminusModule, StorageModule, PrismaModule],
  controllers: [HealthController],
  providers: [MailHealthIndicator, MinioHealthIndicator],
})
export class HealthModule {}
