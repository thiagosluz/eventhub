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
exports.SpeakersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SpeakersService = class SpeakersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, data) {
        return this.prisma.speaker.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }
    async findAll(tenantId) {
        return this.prisma.speaker.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(tenantId, id) {
        const speaker = await this.prisma.speaker.findFirst({
            where: { id, tenantId },
        });
        if (!speaker) {
            throw new common_1.NotFoundException(`Speaker with ID ${id} not found.`);
        }
        return speaker;
    }
    async update(tenantId, id, data) {
        await this.findOne(tenantId, id);
        return this.prisma.speaker.update({
            where: { id },
            data,
        });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        return this.prisma.speaker.delete({
            where: { id },
        });
    }
};
exports.SpeakersService = SpeakersService;
exports.SpeakersService = SpeakersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SpeakersService);
//# sourceMappingURL=speakers.service.js.map