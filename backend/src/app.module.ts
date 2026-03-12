import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProtectedExampleController } from './example/protected.controller';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { PrismaService } from './prisma/prisma.service';
import { MinioService } from './storage/minio.service';

@Module({
  imports: [AuthModule],
  controllers: [ProtectedExampleController, EventsController],
  providers: [EventsService, PrismaService, MinioService],
})
export class AppModule {}
