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
exports.IntelligenceController = void 0;
const common_1 = require("@nestjs/common");
const intelligence_service_1 = require("./intelligence.service");
let IntelligenceController = class IntelligenceController {
    intelligenceService;
    constructor(intelligenceService) {
        this.intelligenceService = intelligenceService;
    }
    async scoreRoute(body) {
        return this.intelligenceService.scoreRoute(body.coordinates);
    }
};
exports.IntelligenceController = IntelligenceController;
__decorate([
    (0, common_1.Post)('score-route'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntelligenceController.prototype, "scoreRoute", null);
exports.IntelligenceController = IntelligenceController = __decorate([
    (0, common_1.Controller)('intelligence'),
    __metadata("design:paramtypes", [intelligence_service_1.IntelligenceService])
], IntelligenceController);
//# sourceMappingURL=intelligence.controller.js.map