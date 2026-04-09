import {
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SuperAdminGuard } from "../common/guards/super-admin.guard";
import { AdminService } from "./admin.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { AdminUpdateUserDto } from "./dto/update-user.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("tenants/:id/users")
  listTenantUsers(@Param("id") id: string) {
    return this.adminService.listTenantUsers(id);
  }

  @Post("tenants")
  createTenant(@Body() dto: CreateTenantDto) {
    return this.adminService.createTenant(dto);
  }

  @Get("tenants")
  listTenants(@Query("page") page: string, @Query("limit") limit: string) {
    return this.adminService.listTenants(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Patch("tenants/:id/status")
  toggleTenantStatus(
    @Param("id") id: string,
    @Body("isActive") isActive: boolean,
  ) {
    return this.adminService.toggleTenantStatus(id, isActive);
  }

  @Get("audit-logs")
  getGlobalAuditLogs(
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Query("tenantId") tenantId?: string,
    @Query("userId") userId?: string,
    @Query("action") action?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.adminService.getGlobalAuditLogs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { tenantId, userId, action, startDate, endDate },
    );
  }

  @Get("stats")
  getGlobalStats() {
    return this.adminService.getGlobalStats();
  }

  @Patch("impersonate/:userId")
  impersonateUser(@Param("userId") targetUserId: string, @Req() req: any) {
    return this.adminService.impersonateUser(targetUserId, req.user.sub);
  }

  @Get("users")
  listGlobalUsers(
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("tenantId") tenantId?: string,
  ) {
    return this.adminService.listGlobalUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { search, role, tenantId },
    );
  }

  @Patch("users/:id")
  updateGlobalUser(@Param("id") id: string, @Body() dto: AdminUpdateUserDto) {
    return this.adminService.updateGlobalUser(id, dto);
  }

  @Post("users/:id/reset-password")
  resetGlobalUserPassword(@Param("id") id: string) {
    return this.adminService.resetGlobalUserPassword(id);
  }
}
