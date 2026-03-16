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
exports.ActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const roles_types_1 = require("../auth/roles.types");
const activities_service_1 = require("./activities.service");
const create_activity_dto_1 = require("./dto/create-activity.dto");
const update_activity_dto_1 = require("./dto/update-activity.dto");
let ActivitiesController = class ActivitiesController {
    constructor(activities) {
        this.activities = activities;
    }
    async createActivity(eventId, body, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error('Missing tenantId on token payload.');
        }
        return this.activities.createActivity({
            tenantId,
            eventId,
            data: body,
        });
    }
    async listActivitiesForEvent(eventId, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error('Missing tenantId on token payload.');
        }
        return this.activities.listActivitiesForEvent(tenantId, eventId);
    }
    async updateActivity(activityId, body, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error('Missing tenantId on token payload.');
        }
        return this.activities.updateActivity({
            tenantId,
            activityId,
            data: body,
        });
    }
    async enrollInActivity(activityId, req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        if (!userId) {
            throw new Error('Missing user id on token payload.');
        }
        return this.activities.enrollInActivity({
            userId,
            activityId,
        });
    }
    async deleteActivity(activityId, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error('Missing tenantId on token payload.');
        }
        return this.activities.deleteActivity(tenantId, activityId);
    }
    async createType(req, name) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error('Missing tenantId');
        return this.activities.createType(tenantId, name);
    }
    async findAllTypes(req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error('Missing tenantId');
        return this.activities.findAllTypes(tenantId);
    }
    async removeType(req, id) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            throw new Error('Missing tenantId');
        return this.activities.removeType(tenantId, id);
    }
};
exports.ActivitiesController = ActivitiesController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)('events/:eventId/activities'),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_activity_dto_1.CreateActivityDto, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "createActivity", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)('events/:eventId/activities'),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "listActivitiesForEvent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Patch)('activities/:activityId'),
    __param(0, (0, common_1.Param)('activityId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_activity_dto_1.UpdateActivityDto, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "updateActivity", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('activities/:activityId/enroll'),
    __param(0, (0, common_1.Param)('activityId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "enrollInActivity", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Delete)('activities/:activityId'),
    __param(0, (0, common_1.Param)('activityId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "deleteActivity", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)('activities/types'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "createType", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)('activities/types'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "findAllTypes", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Delete)('activities/types/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "removeType", null);
exports.ActivitiesController = ActivitiesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [activities_service_1.ActivitiesService])
], ActivitiesController);
//# sourceMappingURL=activities.controller.js.map