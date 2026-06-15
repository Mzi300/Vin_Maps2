"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const config_1 = require("@nestjs/config");
const data_source_1 = require("./database/data-source");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const api_key_guard_1 = require("./modules/auth/api-key.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const promotions_module_1 = require("./modules/promotions/promotions.module");
const places_module_1 = require("./modules/places/places.module");
const users_module_1 = require("./modules/users/users.module");
const api_usage_module_1 = require("./modules/api-usage/api-usage.module");
const schedule_1 = require("@nestjs/schedule");
const routing_module_1 = require("./modules/routing/routing.module");
const traffic_module_1 = require("./modules/traffic/traffic.module");
const incidents_module_1 = require("./modules/incidents/incidents.module");
const geo_module_1 = require("./modules/geo/geo.module");
const safety_zones_module_1 = require("./modules/safety-zones/safety-zones.module");
const telemetry_module_1 = require("./modules/telemetry/telemetry.module");
const health_module_1 = require("./modules/health/health.module");
const verification_module_1 = require("./modules/verification/verification.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const cache_module_1 = require("./cache/cache.module");
const voice_module_1 = require("./voice/voice.module");
const metrics_module_1 = require("./monitoring/metrics.module");
const env_validation_1 = require("./config/env.validation");
const jwt_config_1 = __importDefault(require("./config/jwt.config"));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    Module({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                validationSchema: env_validation_1.envValidationSchema,
                load: [jwt_config_1.default],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    ...data_source_1.dataSourceOptions,
                    autoLoadEntities: true,
                }),
                inject: [config_1.ConfigService],
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            auth_module_1.AuthModule,
            api_usage_module_1.ApiUsageModule,
            schedule_1.ScheduleModule.forRoot(),
            places_module_1.PlacesModule,
            promotions_module_1.PromotionsModule,
            users_module_1.UsersModule,
            routing_module_1.RoutingModule,
            traffic_module_1.TrafficModule,
            incidents_module_1.IncidentsModule,
            geo_module_1.GeoModule,
            safety_zones_module_1.SafetyZonesModule,
            telemetry_module_1.TelemetryModule,
            health_module_1.HealthModule,
            verification_module_1.VerificationModule,
            notifications_module_1.NotificationsModule,
            cache_module_1.AppCacheModule,
            voice_module_1.VoiceModule,
            metrics_module_1.MetricsModule,
            ObservabilityModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: api_key_guard_1.ApiKeyGuard },
        ],
        configure(consumer) {
            consumer.apply(require('./middleware/analytics.middleware').default).forRoutes('*');
        },
    })
], AppModule);
//# sourceMappingURL=app.module.js.map