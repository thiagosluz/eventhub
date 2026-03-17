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
exports.SponsorsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const roles_types_1 = require("../auth/roles.types");
const sponsors_service_1 = require("./sponsors.service");
const sponsor_category_dto_1 = require("./dto/sponsor-category.dto");
const sponsor_dto_1 = require("./dto/sponsor.dto");
let SponsorsController = class SponsorsController {
    constructor(sponsorsService) {
        this.sponsorsService = sponsorsService;
    }
    async createCategory(eventId, dto, req) {
        return this.sponsorsService.createCategory(req.user.tenantId, eventId, dto);
    }
    async listCategories(eventId, req) {
        return this.sponsorsService.listCategoriesByEvent(req.user.tenantId, eventId);
    }
    async updateCategory(id, dto, req) {
        return this.sponsorsService.updateCategory(req.user.tenantId, id, dto);
    }
    async deleteCategory(id, req) {
        return this.sponsorsService.deleteCategory(req.user.tenantId, id);
    }
    async createSponsor(dto, req) {
        return this.sponsorsService.createSponsor(req.user.tenantId, dto);
    }
    async updateSponsor(id, dto, req) {
        return this.sponsorsService.updateSponsor(req.user.tenantId, id, dto);
    }
    async deleteSponsor(id, req) {
        return this.sponsorsService.deleteSponsor(req.user.tenantId, id);
    }
    async uploadLogo(id, file, req) {
        return this.sponsorsService.uploadLogo(req.user.tenantId, id, file);
    }
    async listPublicSponsors(slug) {
        return this.sponsorsService.listPublicSponsorsByEventSlug(slug);
    }
};
exports.SponsorsController = SponsorsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("categories/:eventId"),
    __param(0, (0, common_1.Param)("eventId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sponsor_category_dto_1.CreateSponsorCategoryDto, Object]),
    __metadata("design:returntype", Promise)
], SponsorsController.prototype, "createCategory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)("categories/:eventId"),
    __param(0, (0, common_1.Param)("eventId")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SponsorsController.prototype, "listCategories", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Patch)("categories/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sponsor_category_dto_1.UpdateSponsorCategoryDto, Object]),
    __metadata("design:returntype", Promise)
], SponsorsController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Delete)("categories/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SponsorsController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sponsor_dto_1.CreateSponsorDto, Object]),
    __metadata("design:returntype", Promise)
], SponsorsController.prototype, "createSponsor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sponsor_dto_1.UpdateSponsorDto, Object]),
    __metadata("design:returntype", Promise)
], SponsorsController.prototype, "updateSponsor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SponsorsController.prototype, "deleteSponsor", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)(":id/logo"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SponsorsController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Get)("public/event/:slug"),
    __param(0, (0, common_1.Param)("slug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SponsorsController.prototype, "listPublicSponsors", null);
exports.SponsorsController = SponsorsController = __decorate([
    (0, common_1.Controller)("sponsors"),
    __metadata("design:paramtypes", [sponsors_service_1.SponsorsService])
], SponsorsController);
//# sourceMappingURL=sponsors.controller.js.map