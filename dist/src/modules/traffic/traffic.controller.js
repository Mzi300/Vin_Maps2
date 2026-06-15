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
exports.TrafficController = void 0;
const common_1 = require("@nestjs/common");
const traffic_service_1 = require("./traffic.service");
const historical_traffic_dto_1 = require("./dto/historical-traffic.dto");
let TrafficController = class TrafficController {
    trafficService;
    constructor(trafficService) {
        this.trafficService = trafficService;
    }
    async getHistorical(query) {
        return this.trafficService.getHistoricalTraffic(query);
    }
};
exports.TrafficController = TrafficController;
__decorate([
    (0, common_1.Get)('historical'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [historical_traffic_dto_1.HistoricalTrafficDto]),
    __metadata("design:returntype", Promise)
], TrafficController.prototype, "getHistorical", null);
exports.TrafficController = TrafficController = __decorate([
    (0, common_1.Controller)('traffic'),
    __metadata("design:paramtypes", [traffic_service_1.TrafficService])
], TrafficController);
//# sourceMappingURL=traffic.controller.js.map