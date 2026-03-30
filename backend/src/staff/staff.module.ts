import { Module } from "@nestjs/common";
import { StaffManagementService } from "./staff-management.service";
import { StaffManagementController } from "./staff-management.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [StaffManagementController],
  providers: [StaffManagementService],
  exports: [StaffManagementService],
})
export class StaffManagementModule {}
