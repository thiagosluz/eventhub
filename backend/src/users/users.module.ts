import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { PublicUsersController } from "./public-users.controller";
import { UsersService } from "./users.service";
import { PrismaModule } from "../prisma/prisma.module";
import { StorageModule } from "../storage/storage.module";
import { BadgesModule } from "../badges/badges.module";

@Module({
  imports: [PrismaModule, StorageModule, BadgesModule],
  controllers: [UsersController, PublicUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
