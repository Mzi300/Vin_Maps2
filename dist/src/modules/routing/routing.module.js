"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingModule = void 0;
const common_1 = require("@nestjs/common");
const preferences_module_1 = require("../preferences/preferences.module");
const route_intelligence_service_1 = require("./route-intelligence.service");
const rule_based_scoring_service_1 = require("./rule-based-scoring.service");
const route_scoring_aggregator_service_1 = require("./route-scoring-aggregator.service");
const routing_controller_1 = require("./routing.controller");
const incidents_module_1 = require("../incidents/incidents.module");
const telemetry_module_1 = require("../telemetry/telemetry.module");
const safety_zones_module_1 = require("../safety-zones/safety-zones.module");
const ai_module_1 = require("../ai/ai.module");
let RoutingModule = class RoutingModule {
};
exports.RoutingModule = RoutingModule;
exports.RoutingModule = RoutingModule = __decorate([
    (0, common_1.Module)({
        imports: [incidents_module_1.IncidentsModule, telemetry_module_1.TelemetryModule, safety_zones_module_1.SafetyZonesModule, ai_module_1.AiModule, preferences_module_1.PreferencesModule],
        controllers: [routing_controller_1.RoutingController],
        providers: [rule_based_scoring_service_1.RuleBasedScoringService, route_scoring_aggregator_service_1.RouteScoringAggregatorService, route_intelligence_service_1.RouteIntelligenceService],
        exports: [route_intelligence_service_1.RouteIntelligenceService],
    })
], RoutingModule);
//# sourceMappingURL=routing.module.js.map