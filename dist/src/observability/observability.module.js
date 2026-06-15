"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservabilityModule = void 0;
const common_1 = require("@nestjs/common");
const metrics_controller_1 = require("./metrics.controller");
const exporter_prometheus_1 = require("@opentelemetry/exporter-prometheus");
const otel_1 = require("@nestjs/otel");
const logger_module_1 = require("./logger.module");
let ObservabilityModule = class ObservabilityModule {
};
exports.ObservabilityModule = ObservabilityModule;
exports.ObservabilityModule = ObservabilityModule = __decorate([
    (0, common_1.Module)({
        imports: [
            otel_1.OpenTelemetryModule.forRoot({
                serviceName: 'vinmaps-backend',
                traceAutoInjectors: [],
                metricExporter: new exporter_prometheus_1.PrometheusExporter({
                    startServer: true,
                    port: Number(process.env.METRICS_PORT) || 9464,
                    endpoint: '/metrics',
                }),
            }),
            logger_module_1.LoggerModule,
        ],
        controllers: [metrics_controller_1.MetricsController],
    })
], ObservabilityModule);
//# sourceMappingURL=observability.module.js.map