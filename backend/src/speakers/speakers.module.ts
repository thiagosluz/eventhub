import { Module } from "@nestjs/common";
import { SpeakersService } from "./speakers.service";
import { SpeakersController } from "./speakers.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [SpeakersController],
  providers: [SpeakersService],
  exports: [SpeakersService],
})
export class SpeakersModule {}
