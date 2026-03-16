"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const roles_types_1 = require("../auth/roles.types");
const tenants_service_1 = require("./tenants.service");
const update_tenant_dto_1 = require("./dto/update-tenant.dto");
const prisma_service_1 = require("../prisma/prisma.service");
let TenantsController = class TenantsController {
    constructor(tenantsService, prisma) {
        this.tenantsService = tenantsService;
        this.prisma = prisma;
    }
    async getPublicTenant() {
        const tenant = await this.prisma.tenant.findFirst();
        return {
            name: tenant === null || tenant === void 0 ? void 0 : tenant.name,
            logoUrl: tenant === null || tenant === void 0 ? void 0 : tenant.logoUrl,
            themeConfig: tenant === null || tenant === void 0 ? void 0 : tenant.themeConfig,
        };
    }
    async getMe(req) {
        return this.tenantsService.getTenant(req.user.tenantId);
    }
    async updateMe(req, data) {
        return this.tenantsService.updateTenant(req.user.tenantId, data);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_1.Get)('public/tenant'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getPublicTenant", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_tenant_dto_1.UpdateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updateMe", null);
exports.TenantsController = TenantsController = __decorate([
    (0, common_1.Controller)('tenants'),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService,
        prisma_service_1.PrismaService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map