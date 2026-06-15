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
var AnomalyDetectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyDetectorService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
let AnomalyDetectorService = AnomalyDetectorService_1 = class AnomalyDetectorService {
    eventEmitter;
    logger = new common_1.Logger(AnomalyDetectorService_1.name);
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    async detectAnomaly(densityChange, speedDrop, activeIncidents) {
        const isSpike = densityChange > 50;
        const isSpeedCollapse = speedDrop > 30;
        const isClusteredIncident = activeIncidents > 2;
        if (isSpike || isSpeedCollapse || isClusteredIncident) {
            this.logger.warn(`Anomaly Detected: densityChange=${densityChange}, speedDrop=${speedDrop}, incidents=${activeIncidents}`);
            this.eventEmitter.emit('anomaly.detected', {
                type: 'REAL_TIME_ANOMALY_ALERT',
                timestamp: new Date().toISOString(),
                details: { densityChange, speedDrop, activeIncidents }
            });
            return true;
        }
        return false;
    }
};
exports.AnomalyDetectorService = AnomalyDetectorService;
exports.AnomalyDetectorService = AnomalyDetectorService = AnomalyDetectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], AnomalyDetectorService);
//# sourceMappingURL=anomaly-detector.service.js.map