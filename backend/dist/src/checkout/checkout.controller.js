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
exports.CheckoutController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const checkout_service_1 = require("./checkout.service");
const swagger_1 = require("@nestjs/swagger");
class FormAnswerDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FormAnswerDto.prototype, "fieldId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FormAnswerDto.prototype, "value", void 0);
class FormResponseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FormResponseDto.prototype, "formId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FormAnswerDto] }),
    __metadata("design:type", Array)
], FormResponseDto.prototype, "answers", void 0);
class CheckoutDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CheckoutDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], required: false }),
    __metadata("design:type", Array)
], CheckoutDto.prototype, "activityIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FormResponseDto], required: false }),
    __metadata("design:type", Array)
], CheckoutDto.prototype, "formResponses", void 0);
let CheckoutController = class CheckoutController {
    constructor(checkout) {
        this.checkout = checkout;
    }
    async checkoutFree(body, req) {
        var _a, _b, _c;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        if (!userId) {
            throw new Error("Missing user id on token payload.");
        }
        const activityIds = (_b = body.activityIds) !== null && _b !== void 0 ? _b : [];
        const formResponses = (_c = body.formResponses) === null || _c === void 0 ? void 0 : _c.map((fr) => ({
            formId: fr.formId,
            answers: fr.answers.map((a) => ({ fieldId: a.fieldId, value: a.value })),
        }));
        const result = await this.checkout.processCheckout({
            eventId: body.eventId,
            activityIds,
            userId,
            formResponses,
        });
        return {
            registrationId: result.registrationId,
            tickets: result.payment.tickets,
            totalAmount: result.payment.totalAmount,
        };
    }
};
exports.CheckoutController = CheckoutController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("checkout"),
    (0, swagger_1.ApiOperation)({ summary: "Process checkout for free tickets and activities" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CheckoutDto, Object]),
    __metadata("design:returntype", Promise)
], CheckoutController.prototype, "checkoutFree", null);
exports.CheckoutController = CheckoutController = __decorate([
    (0, swagger_1.ApiTags)("checkout"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [checkout_service_1.CheckoutService])
], CheckoutController);
//# sourceMappingURL=checkout.controller.js.map