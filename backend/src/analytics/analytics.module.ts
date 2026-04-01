import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { PrismaModule } from "../prisma/prisma.module";
import { GamificationModule } from "../gamification/gamification.module";
import { BadgesModule } from "../badges/badges.module";

@Module({
  imports: [PrismaModule, GamificationModule, BadgesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
