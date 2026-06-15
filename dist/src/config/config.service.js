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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class EnvVars {
    MAPBOX_TOKEN;
    TRAFFIC_API_KEY;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EnvVars.prototype, "MAPBOX_TOKEN", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EnvVars.prototype, "TRAFFIC_API_KEY", void 0);
let ConfigService = class ConfigService {
    cs;
    env;
    constructor(cs) {
        this.cs = cs;
        this.env = (0, class_transformer_1.plainToClass)(EnvVars, {
            MAPBOX_TOKEN: cs.get('MAPBOX_TOKEN'),
            TRAFFIC_API_KEY: cs.get('TRAFFIC_API_KEY'),
        });
        const errors = (0, class_validator_1.validateSync)(this.env);
        if (errors.length) {
            throw new Error('Missing required environment variables: ' + errors.map(e => e.property).join(', '));
        }
    }
    getMapboxToken() {
        return this.env.MAPBOX_TOKEN;
    }
    getTrafficApiKey() {
        return this.env.TRAFFIC_API_KEY;
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConfigService);
//# sourceMappingURL=config.service.js.map