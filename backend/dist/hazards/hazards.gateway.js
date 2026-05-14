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
exports.HazardsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const hazards_service_1 = require("./hazards.service");
let HazardsGateway = class HazardsGateway {
    hazardsService;
    server;
    constructor(hazardsService) {
        this.hazardsService = hazardsService;
    }
    handleConnection(client) {
        console.log(`[Tactical Link] Operator Connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`[Tactical Link] Operator Offline: ${client.id}`);
    }
    async handleHazardReport(data) {
        const hazard = await this.hazardsService.report({
            ...data,
            location: { type: 'Point', coordinates: [data.lng, data.lat] }
        });
        this.server.emit('hazard-update', hazard);
        return hazard;
    }
};
exports.HazardsGateway = HazardsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], HazardsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('report-hazard'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HazardsGateway.prototype, "handleHazardReport", null);
exports.HazardsGateway = HazardsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    __metadata("design:paramtypes", [hazards_service_1.HazardsService])
], HazardsGateway);
//# sourceMappingURL=hazards.gateway.js.map