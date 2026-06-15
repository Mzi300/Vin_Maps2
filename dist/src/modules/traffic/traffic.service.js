"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficService = void 0;
const common_1 = require("@nestjs/common");
let TrafficService = class TrafficService {
    async getHistoricalTraffic(dto) {
        let routeCoords = [];
        try {
            routeCoords = JSON.parse(dto.route);
        }
        catch (e) {
        }
        const data = routeCoords.map(coord => ({
            coordinate: coord,
            speedFactor: Math.random() * 0.5 + 0.75,
        }));
        return { points: data };
    }
};
exports.TrafficService = TrafficService;
exports.TrafficService = TrafficService = __decorate([
    (0, common_1.Injectable)()
], TrafficService);
//# sourceMappingURL=traffic.service.js.map