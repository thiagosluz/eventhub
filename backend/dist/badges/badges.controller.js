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
exports.BadgesController = void 0;
const common_1 = require("@nestjs/common");
const badges_service_1 = require("./badges.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_types_1 = require("../auth/roles.types");
let BadgesController = class BadgesController {
    constructor(badgesService) {
        this.badgesService = badgesService;
    }
    getMyBadges(req) {
        return this.badgesService.getMyBadges(req.user.sub);
    }
    getAvailable(req) {
        return this.badgesService.getAvailableBadges(req.user.sub);
    }
    create(req, eventId, body) {
        return this.badgesService.createBadge(req.user.tenantId, eventId, body);
    }
    findAll(req, eventId) {
        return this.badgesService.getBadgesByEvent(req.user.tenantId, eventId);
    }
    update(req, id, body) {
        return this.badgesService.updateBadge(req.user.tenantId, id, body);
    }
    claim(req, id, claimCode) {
        return this.badgesService.claimBadge(req.user.sub, id, claimCode);
    }
    awardByScan(req, id, ticketToken) {
        return this.badgesService.awardBadgeByScan(req.user.tenantId, id, ticketToken);
    }
    getClaimCodes(req, id) {
        return this.badgesService.getBadgeClaimCodes(req.user.tenantId, id);
    }
    remove(req, id) {
        return this.badgesService.deleteBadge(req.user.tenantId, id);
    }
};
exports.BadgesController = BadgesController;
__decorate([
    (0, common_1.Get)("my"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BadgesController.prototype, "getMyBadges", null);
__decorate([
    (0, common_1.Get)("available"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BadgesController.prototype, "getAvailable", null);
__decorate([
    (0, common_1.Post)("event/:eventId"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("eventId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], BadgesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("event/:eventId"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BadgesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], BadgesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)("claim/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("claimCode")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BadgesController.prototype, "claim", null);
__decorate([
    (0, common_1.Post)(":id/award-scan"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("ticketToken")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BadgesController.prototype, "awardByScan", null);
__decorate([
    (0, common_1.Get)(":id/claim-codes"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BadgesController.prototype, "getClaimCodes", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BadgesController.prototype, "remove", null);
exports.BadgesController = BadgesController = __decorate([
    (0, common_1.Controller)("badges"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [badges_service_1.BadgesService])
], BadgesController);
//# sourceMappingURL=badges.controller.js.map