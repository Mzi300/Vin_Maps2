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
exports.FleetService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const driver_session_entity_1 = require("./driver-session.entity");
let FleetService = class FleetService {
    sessionRepository;
    constructor(sessionRepository) {
        this.sessionRepository = sessionRepository;
    }
    async getOrCreateSession(operatorId) {
        let session = await this.sessionRepository.findOne({ where: { operator_id: operatorId } });
        if (!session) {
            session = this.sessionRepository.create({ operator_id: operatorId });
            await this.sessionRepository.save(session);
        }
        return session;
    }
    async recordEvent(operatorId, type) {
        const session = await this.getOrCreateSession(operatorId);
        if (type === 'hard_braking') {
            session.hard_braking_events += 1;
            session.safety_score = Math.max(0, session.safety_score - 2);
        }
        else if (type === 'pothole') {
            session.potholes_detected += 1;
        }
        return this.sessionRepository.save(session);
    }
};
exports.FleetService = FleetService;
exports.FleetService = FleetService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driver_session_entity_1.DriverSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FleetService);
//# sourceMappingURL=fleet.service.js.map