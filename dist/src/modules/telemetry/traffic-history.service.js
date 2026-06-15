"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TrafficHistoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficHistoryService = void 0;
const common_1 = require("@nestjs/common");
let TrafficHistoryService = TrafficHistoryService_1 = class TrafficHistoryService {
    logger = new common_1.Logger(TrafficHistoryService_1.name);
    history = new Map();
    recordSnapshot(snapshot) {
        if (!this.history.has(snapshot.clusterId)) {
            this.history.set(snapshot.clusterId, []);
        }
        const snapshots = this.history.get(snapshot.clusterId);
        snapshots.push(snapshot);
        const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
        while (snapshots.length > 0 && snapshots[0].timestamp.getTime() < thirtyMinsAgo) {
            snapshots.shift();
        }
        if (snapshots.length === 0) {
            this.history.delete(snapshot.clusterId);
            this.logger.debug(`Cleaned up stale history for cluster ${snapshot.clusterId}`);
        }
    }
    getHistory(clusterId) {
        return this.history.get(clusterId) || [];
    }
    getHistorySize() {
        return this.history.size;
    }
};
exports.TrafficHistoryService = TrafficHistoryService;
exports.TrafficHistoryService = TrafficHistoryService = TrafficHistoryService_1 = __decorate([
    (0, common_1.Injectable)()
], TrafficHistoryService);
//# sourceMappingURL=traffic-history.service.js.map