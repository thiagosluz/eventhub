import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { PrismaService } from "../prisma/prisma.service";
import { MailHealthIndicator } from "./indicators/mail.health";
import { MinioHealthIndicator } from "./indicators/minio.health";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SuperAdminGuard } from "../common/guards/super-admin.guard";

@Controller("admin/health")
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
    private mailHealth: MailHealthIndicator,
    private minioHealth: MinioHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck("database", this.prisma),
      () => this.mailHealth.isHealthy("email"),
      () => this.minioHealth.isHealthy("storage"),
    ]);
  }
}
