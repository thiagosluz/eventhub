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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
class RegisterOrganizerDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Minha Organização" }),
    __metadata("design:type", String)
], RegisterOrganizerDto.prototype, "tenantName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "minha-org" }),
    __metadata("design:type", String)
], RegisterOrganizerDto.prototype, "tenantSlug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Thiago Luz" }),
    __metadata("design:type", String)
], RegisterOrganizerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "thiago@example.com" }),
    __metadata("design:type", String)
], RegisterOrganizerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "password123" }),
    __metadata("design:type", String)
], RegisterOrganizerDto.prototype, "password", void 0);
class LoginDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "thiago@example.com" }),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "password123" }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class RefreshTokenDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refresh_token", void 0);
class ForgotPasswordDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "thiago@example.com" }),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
class ResetPasswordDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "newpassword123" }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    registerOrganizer(body) {
        return this.authService.registerOrganizer(body);
    }
    registerParticipant(body) {
        return this.authService.registerParticipant(body);
    }
    login(body) {
        return this.authService.login(body);
    }
    refresh(body) {
        return this.authService.refresh(body.refresh_token);
    }
    logout(req) {
        return this.authService.logout(req.user.sub);
    }
    forgotPassword(body) {
        return this.authService.forgotPassword(body.email);
    }
    resetPassword(body) {
        return this.authService.resetPassword(body.token, body.newPassword);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("register-organizer"),
    (0, swagger_1.ApiOperation)({ summary: "Register a new organizer and tenant" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterOrganizerDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registerOrganizer", null);
__decorate([
    (0, common_1.Post)("register-participant"),
    (0, swagger_1.ApiOperation)({ summary: "Register a new participant (guest)" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registerParticipant", null);
__decorate([
    (0, common_1.Post)("login"),
    (0, swagger_1.ApiOperation)({ summary: "Authenticate and get JWT tokens" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("refresh"),
    (0, swagger_1.ApiOperation)({ summary: "Refresh access token using refresh token" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RefreshTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)("logout"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Logout and invalidate refresh token" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)("forgot-password"),
    (0, swagger_1.ApiOperation)({ summary: "Request password recovery token" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ForgotPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)("reset-password"),
    (0, swagger_1.ApiOperation)({ summary: "Reset password using token" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)("auth"),
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map