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
exports.RoutingController = void 0;
const common_1 = require("@nestjs/common");
const route_intelligence_service_1 = require("./route-intelligence.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const outcome_tracker_service_1 = require("../ai/learning/outcome-tracker.service");
let RoutingController = class RoutingController {
    routeIntelligenceService;
    outcomeTrackerService;
    constructor(routeIntelligenceService, outcomeTrackerService) {
        this.routeIntelligenceService = routeIntelligenceService;
        this.outcomeTrackerService = outcomeTrackerService;
    }
    async getSmartRoutes(start, end, req) {
        const [startLat, startLng] = start.split(',').map(Number);
        const [endLat, endLng] = end.split(',').map(Number);
        return this.routeIntelligenceService.calculateSmartRoutes(startLat, startLng, endLat, endLng, req.user.id);
    }
    async completeTrip(payload) {
        const normalizedPayload = {
            ...payload,
            startTime: new Date(payload.startTime),
            endTime: new Date(payload.endTime),
        };
        return this.outcomeTrackerService.finalizeTrip(normalizedPayload);
    }
};
exports.RoutingController = RoutingController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('smart'),
    __param(0, (0, common_1.Query)('start')),
    __param(1, (0, common_1.Query)('end')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RoutingController.prototype, "getSmartRoutes", null);
__decorate([
    (0, common_1.Post)('complete-trip'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RoutingController.prototype, "completeTrip", null);
exports.RoutingController = RoutingController = __decorate([
    (0, common_1.Controller)('routing'),
    __metadata("design:paramtypes", [route_intelligence_service_1.RouteIntelligenceService,
        outcome_tracker_service_1.OutcomeTrackerService])
], RoutingController);
//# sourceMappingURL=routing.controller.js.map