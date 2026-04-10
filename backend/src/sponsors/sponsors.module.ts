import { Module } from "@nestjs/common";
import { SponsorsController } from "./sponsors.controller";
import { SponsorsService } from "./sponsors.service";
import { PrismaModule } from "../prisma/prisma.module";
import { StorageModule } from "../storage/storage.module";

import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, StorageModule, AuthModule],
  controllers: [SponsorsController],
  providers: [SponsorsService],
  exports: [SponsorsService],
})
export class SponsorsModule {}
