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
exports.EmergencyGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let EmergencyGateway = class EmergencyGateway {
    server;
    async handleSos(data, client) {
        const sosEvent = {
            id: `SOS-${Date.now()}`,
            operatorId: client.id,
            location: data.location,
            message: data.message || 'EMERGENCY: TACTICAL ASSISTANCE REQUIRED',
            timestamp: Date.now(),
            severity: 'CRITICAL'
        };
        console.log(`[EMERGENCY] SOS RECEIVED FROM ${client.id} at ${data.location}`);
        this.server.emit('sos-broadcast', sosEvent);
        return sosEvent;
    }
    async handleCancelSos(client) {
        this.server.emit('sos-cancelled', { operatorId: client.id });
        return { success: true };
    }
};
exports.EmergencyGateway = EmergencyGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EmergencyGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('trigger-sos'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], EmergencyGateway.prototype, "handleSos", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('cancel-sos'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], EmergencyGateway.prototype, "handleCancelSos", null);
exports.EmergencyGateway = EmergencyGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } })
], EmergencyGateway);
//# sourceMappingURL=emergency.gateway.js.map