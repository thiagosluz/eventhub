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
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const roles_types_1 = require("../auth/roles.types");
const events_service_1 = require("./events.service");
const create_event_dto_1 = require("./dto/create-event.dto");
const update_event_dto_1 = require("./dto/update-event.dto");
const jwt_1 = require("@nestjs/jwt");
const minio_service_1 = require("../storage/minio.service");
let EventsController = class EventsController {
    constructor(eventsService, minioService, jwtService) {
        this.eventsService = eventsService;
        this.minioService = minioService;
        this.jwtService = jwtService;
    }
    async createEvent(body, req) {
        var _a, _b;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Missing tenantId on token payload.");
        }
        try {
            return await this.eventsService.createEvent({
                tenantId,
                data: body,
            });
        }
        catch (error) {
            if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes("slug")) {
                throw new common_1.BadRequestException(error.message);
            }
            throw error;
        }
    }
    async listEvents(req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Missing tenantId on token payload.");
        }
        return this.eventsService.listEventsForTenant(tenantId);
    }
    async getEvent(id, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Missing tenantId on token payload.");
        }
        return this.eventsService.findEventById(tenantId, id);
    }
    async updateEvent(id, body, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Missing tenantId on token payload.");
        }
        return this.eventsService.updateEvent({
            tenantId,
            eventId: id,
            data: body,
        });
    }
    async deleteEvent(id, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Missing tenantId on token payload.");
        }
        return this.eventsService.deleteEvent(tenantId, id);
    }
    async exportParticipants(req, res, eventId, search) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Tenant missing");
        }
        const participants = await this.eventsService.listParticipants(tenantId, {
            eventId,
            search,
        });
        const header = "Nome,Email,Evento,Ticket,Data de Inscrição\n";
        const rows = participants
            .map((p) => {
            var _a;
            const name = p.user.name.replace(/,/g, "");
            const email = p.user.email;
            const eventName = p.event.name.replace(/,/g, "");
            const ticketType = ((_a = p.tickets[0]) === null || _a === void 0 ? void 0 : _a.type) || "N/A";
            const date = new Date(p.createdAt).toLocaleDateString("pt-BR");
            return `${name},${email},${eventName},${ticketType},${date}`;
        })
            .join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=participantes.csv");
        res.status(200).send(header + rows);
    }
    async getParticipantDetail(req, id) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Tenant missing");
        }
        return this.eventsService.findParticipantDetail(tenantId, id);
    }
    async listParticipants(req, eventId, search) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Tenant missing");
        }
        return this.eventsService.listParticipants(tenantId, { eventId, search });
    }
    async uploadBanner(id, file, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Missing tenantId on token payload.");
        }
        const objectName = `events/${id}/banner-${Date.now()}`;
        const url = await this.minioService.uploadObject({
            bucket: "event-media",
            objectName,
            data: file.buffer,
            contentType: file.mimetype,
        });
        return this.eventsService.updateEvent({
            tenantId,
            eventId: id,
            data: { bannerUrl: url },
        });
    }
    async uploadLogo(id, file, req) {
        var _a;
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId) {
            throw new Error("Missing tenantId on token payload.");
        }
        const objectName = `events/${id}/logo-${Date.now()}`;
        const url = await this.minioService.uploadObject({
            bucket: "event-media",
            objectName,
            data: file.buffer,
            contentType: file.mimetype,
        });
        return this.eventsService.updateEvent({
            tenantId,
            eventId: id,
            data: { logoUrl: url },
        });
    }
    async listPublicEvents() {
        return this.eventsService.findAllPublic();
    }
    async getPublicEvent(slug, req) {
        let organizerTenantId;
        const authHeader = req.headers["authorization"];
        if (authHeader &&
            typeof authHeader === "string" &&
            authHeader.startsWith("Bearer ")) {
            try {
                const token = authHeader.split(" ")[1];
                const decoded = this.jwtService.decode(token);
                if (decoded && decoded.tenantId) {
                    organizerTenantId = decoded.tenantId;
                }
            }
            catch {
            }
        }
        return this.eventsService.findPublicBySlug(slug, organizerTenantId);
    }
    async getMyTickets(req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        if (!userId) {
            throw new Error("Missing user id on token payload.");
        }
        return this.eventsService.findMyTickets(userId);
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("events"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_event_dto_1.CreateEventDto, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "createEvent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)("events"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "listEvents", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)("events/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEvent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Patch)("events/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_event_dto_1.UpdateEventDto, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "updateEvent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Delete)("events/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "deleteEvent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)("participants/export"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)("eventId")),
    __param(3, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "exportParticipants", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)("participants/:id"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getParticipantDetail", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Get)("participants"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("eventId")),
    __param(2, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "listParticipants", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("events/:id/banner"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "uploadBanner", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_types_1.UserRole.ORGANIZER),
    (0, common_1.Post)("events/:id/logo"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Get)("public/events"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "listPublicEvents", null);
__decorate([
    (0, common_1.Get)("public/events/:slug"),
    __param(0, (0, common_1.Param)("slug")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getPublicEvent", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("my-tickets"),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getMyTickets", null);
exports.EventsController = EventsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [events_service_1.EventsService,
        minio_service_1.MinioService,
        jwt_1.JwtService])
], EventsController);
//# sourceMappingURL=events.controller.js.map