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
exports.SubmissionsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const roles_types_1 = require("../auth/roles.types");
const create_submission_dto_1 = require("./dto/create-submission.dto");
const submit_review_dto_1 = require("./dto/submit-review.dto");
const submissions_service_1 = require("./submissions.service");
let SubmissionsController = class SubmissionsController {
    constructor(submissions) {
        this.submissions = submissions;
    }
    async createSubmission(file, body, req) {
        var _a;
        const authorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        if (!authorId) {
            throw new Error("Missing user id on token payload.");
        }
        if (!file) {
            throw new Error("Arquivo de submissão é obrigatório.");
        }
        return this.submissions.createSubmission({
            authorId,
            eventId: body.eventId,
            title: body.title,
            abstract: body.abstract,
            file: {
                buffer: file.buffer,
                mimetype: file.mimetype,
            },
        });
    }
    async listSubmissionsForEvent(eventId, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Missing tenantId on token payload.");
        }
        return this.submissions.listSubmissionsForEvent(tenantId, eventId);
    }
    async listAssignedToMe(req) {
        var _a;
        const reviewerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        if (!reviewerId) {
            throw new Error("Missing user id on token payload.");
        }
        return this.submissions.listAssignedToReviewer(reviewerId);
    }
    async listMySubmissions(req) {
        var _a;
        const authorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        if (!authorId) {
            throw new Error("Missing user id on token payload.");
        }
        return this.submissions.listMySubmissions(authorId);
    }
    async submitReview(body, req) {
        var _a;
        const reviewerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        if (!reviewerId) {
            throw new Error("Missing user id on token payload.");
        }
        return this.submissions.submitReview({
            reviewerId,
            submissionId: body.submissionId,
            score: body.score,
            recommendation: body.recommendation,
            comments: body.comments,
        });
    }
};
exports.SubmissionsController = SubmissionsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("submissions"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_submission_dto_1.CreateSubmissionDto, Object]),
    __metadata("design:returntype", Promise)
], SubmissionsController.prototype, "createSubmission", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)("events/:eventId/submissions"),
    __param(0, (0, common_1.Param)("eventId")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SubmissionsController.prototype, "listSubmissionsForEvent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("me/reviews"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubmissionsController.prototype, "listAssignedToMe", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("me/submissions"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubmissionsController.prototype, "listMySubmissions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("reviews"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_review_dto_1.SubmitReviewDto, Object]),
    __metadata("design:returntype", Promise)
], SubmissionsController.prototype, "submitReview", null);
exports.SubmissionsController = SubmissionsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [submissions_service_1.SubmissionsService])
], SubmissionsController);
//# sourceMappingURL=submissions.controller.js.map