import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './auth/roles.guard';
import { ProtectedExampleController } from './example/protected.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProtectedExampleController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
