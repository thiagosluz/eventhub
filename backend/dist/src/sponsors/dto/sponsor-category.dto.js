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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSponsorCategoryDto = exports.CreateSponsorCategoryDto = void 0;
const class_validator_1 = require("class-validator");
const prisma_1 = require("../../generated/prisma");
class CreateSponsorCategoryDto {
}
exports.CreateSponsorCategoryDto = CreateSponsorCategoryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSponsorCategoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateSponsorCategoryDto.prototype, "displayOrder", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(prisma_1.SponsorSize),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSponsorCategoryDto.prototype, "size", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSponsorCategoryDto.prototype, "color", void 0);
class UpdateSponsorCategoryDto {
}
exports.UpdateSponsorCategoryDto = UpdateSponsorCategoryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSponsorCategoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSponsorCategoryDto.prototype, "displayOrder", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(prisma_1.SponsorSize),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSponsorCategoryDto.prototype, "size", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSponsorCategoryDto.prototype, "color", void 0);
//# sourceMappingURL=sponsor-category.dto.js.map