import { Module } from "@nestjs/common";
import { SponsorsController } from "./sponsors.controller";
import { SponsorsService } from "./sponsors.service";
import { PrismaModule } from "../prisma/prisma.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [SponsorsController],
  providers: [SponsorsService],
  exports: [SponsorsService],
})
export class SponsorsModule {}
