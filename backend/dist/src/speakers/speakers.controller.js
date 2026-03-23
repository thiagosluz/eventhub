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
exports.SpeakersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const roles_types_1 = require("../auth/roles.types");
const speakers_service_1 = require("./speakers.service");
const create_speaker_dto_1 = require("./dto/create-speaker.dto");
const update_speaker_dto_1 = require("./dto/update-speaker.dto");
let SpeakersController = class SpeakersController {
    constructor(speakersService) {
        this.speakersService = speakersService;
    }
    async getMe(req) {
        return this.speakersService.findByUserId(req.user.sub);
    }
    async getMyActivities(req) {
        const speaker = await this.speakersService.findByUserId(req.user.sub);
        return this.speakersService.findActivities(speaker.id);
    }
    async getMyFeedbacks(req) {
        const speaker = await this.speakersService.findByUserId(req.user.sub);
        return this.speakersService.getFeedbacks(speaker.id);
    }
    async addMaterial(req, activityId, data) {
        const speaker = await this.speakersService.findByUserId(req.user.sub);
        const activities = await this.speakersService.findActivities(speaker.id);
        const hasActivity = activities.some((a) => a.activityId === activityId);
        if (!hasActivity) {
            throw new Error("Você não tem permissão para adicionar materiais a esta atividade.");
        }
        return this.speakersService.addMaterial(activityId, data);
    }
    async create(req, data) {
        return this.speakersService.create(req.user.tenantId, data);
    }
    async findAll(req) {
        return this.speakersService.findAll(req.user.tenantId);
    }
    async uploadFile(req, file) {
        return this.speakersService.uploadAvatar(req.user.tenantId, file);
    }
    async createRole(req, name) {
        return this.speakersService.createRole(req.user.tenantId, name);
    }
    async findAllRoles(req) {
        return this.speakersService.findAllRoles(req.user.tenantId);
    }
    async removeRole(req, id) {
        return this.speakersService.removeRole(req.user.tenantId, id);
    }
    async findOne(req, id) {
        return this.speakersService.findOne(req.user.tenantId, id);
    }
    async update(req, id, data) {
        let tenantId = req.user.tenantId;
        if (req.user.role === roles_types_1.UserRole.SPEAKER) {
            const speaker = await this.speakersService.findByUserId(req.user.sub);
            if (speaker.id !== id) {
                throw new Error("Você só pode atualizar seu próprio perfil.");
            }
            tenantId = speaker.tenantId;
        }
        return this.speakersService.update(tenantId, id, data);
    }
    async remove(req, id) {
        return this.speakersService.remove(req.user.tenantId, id);
    }
};
exports.SpeakersController = SpeakersController;
__decorate([
    (0, common_1.Get)("me"),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.SPEAKER),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)("me/activities"),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.SPEAKER),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "getMyActivities", null);
__decorate([
    (0, common_1.Get)("me/feedbacks"),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.SPEAKER),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "getMyFeedbacks", null);
__decorate([
    (0, common_1.Post)("me/activities/:activityId/materials"),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.SPEAKER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("activityId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "addMaterial", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_speaker_dto_1.CreateSpeakerDto]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)("upload"),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER, roles_types_1.UserRole.SPEAKER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)("roles"),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)("name")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "createRole", null);
__decorate([
    (0, common_1.Get)("roles"),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "findAllRoles", null);
__decorate([
    (0, common_1.Delete)("roles/:id"),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "removeRole", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER, roles_types_1.UserRole.SPEAKER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_speaker_dto_1.UpdateSpeakerDto]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SpeakersController.prototype, "remove", null);
exports.SpeakersController = SpeakersController = __decorate([
    (0, common_1.Controller)("speakers"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [speakers_service_1.SpeakersService])
], SpeakersController);
//# sourceMappingURL=speakers.controller.js.map