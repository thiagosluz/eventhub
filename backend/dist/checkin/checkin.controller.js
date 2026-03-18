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
exports.CheckinController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const roles_types_1 = require("../auth/roles.types");
const checkin_service_1 = require("./checkin.service");
let CheckinController = class CheckinController {
    constructor(checkinService) {
        this.checkinService = checkinService;
    }
    async getTicketQrCode(id, req, res) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        if (!userId) {
            throw new Error("Missing user id on token payload.");
        }
        const png = await this.checkinService.getQrCodePng(id, userId);
        res.setHeader("Content-Type", "image/png");
        res.send(png);
    }
    async checkin(body) {
        return this.checkinService.checkin({
            qrCodeToken: body.qrCodeToken,
            activityId: body.activityId,
        });
    }
    async drawRaffle(body, req) {
        var _a, _b;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Missing tenantId on token payload.");
        }
        return this.checkinService.drawRaffle({
            tenantId,
            eventId: body.eventId,
            activityId: body.activityId,
            count: (_b = body.count) !== null && _b !== void 0 ? _b : 1,
            rule: body.rule,
            prizeName: body.prizeName,
            uniqueWinners: body.uniqueWinners,
            excludeStaff: body.excludeStaff,
        });
    }
    async getLatestRaffle(eventId, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error("Missing tenantId");
        const history = await this.checkinService.getEventRaffleHistory(tenantId, eventId);
        return history.length > 0 ? history[0] : null;
    }
    async setRaffleDisplayVisibility(id, body, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error("Missing tenantId");
        await this.checkinService.setRaffleDisplayVisibility(tenantId, id, body.hide);
        return { success: true };
    }
    async getRaffleHistory(eventId, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error("Missing tenantId");
        return this.checkinService.getEventRaffleHistory(tenantId, eventId);
    }
    async deleteRaffleHistory(id, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error("Missing tenantId");
        await this.checkinService.deleteRaffleHistory(tenantId, id);
    }
    async markPrizeReceived(id, body, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error("Missing tenantId");
        return this.checkinService.markPrizeReceived(tenantId, id, body.received);
    }
    async undoCheckin(id) {
        return this.checkinService.undoCheckin(id);
    }
};
exports.CheckinController = CheckinController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("tickets/:id/qrcode"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "getTicketQrCode", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("checkin"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "checkin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("raffles"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "drawRaffle", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)("raffles/latest/:eventId"),
    __param(0, (0, common_1.Param)("eventId")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "getLatestRaffle", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("raffles/history/:id/hide"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "setRaffleDisplayVisibility", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)("raffles/history/:eventId"),
    __param(0, (0, common_1.Param)("eventId")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "getRaffleHistory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Delete)("raffles/history/:id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "deleteRaffleHistory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("raffles/history/:id/receive"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "markPrizeReceived", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, common_1.Delete)("checkin/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CheckinController.prototype, "undoCheckin", null);
exports.CheckinController = CheckinController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [checkin_service_1.CheckinService])
], CheckinController);
//# sourceMappingURL=checkin.controller.js.map