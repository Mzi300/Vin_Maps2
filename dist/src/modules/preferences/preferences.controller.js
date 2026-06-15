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
exports.PreferencesController = void 0;
const common_1 = require("@nestjs/common");
const preferences_service_1 = require("./preferences.service");
const swagger_1 = require("@nestjs/swagger");
const create_preference_dto_1 = require("./dto/create-preference.dto");
const update_preference_dto_1 = require("./dto/update-preference.dto");
let PreferencesController = class PreferencesController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(req, dto) {
        return this.service.create(req.user.id, dto);
    }
    get(req) {
        return this.service.findOne(req.user.id);
    }
    update(req, dto) {
        return this.service.update(req.user.id, dto);
    }
};
exports.PreferencesController = PreferencesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Preference created', type: create_preference_dto_1.CreatePreferenceDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_preference_dto_1.CreatePreferenceDto]),
    __metadata("design:returntype", void 0)
], PreferencesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOkResponse)({ description: 'Current preferences', type: create_preference_dto_1.CreatePreferenceDto }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PreferencesController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(),
    (0, swagger_1.ApiOkResponse)({ description: 'Preference updated', type: update_preference_dto_1.UpdatePreferenceDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_preference_dto_1.UpdatePreferenceDto]),
    __metadata("design:returntype", void 0)
], PreferencesController.prototype, "update", null);
exports.PreferencesController = PreferencesController = __decorate([
    (0, swagger_1.ApiTags)('preferences'),
    (0, common_1.Controller)('preferences'),
    __metadata("design:paramtypes", [preferences_service_1.PreferencesService])
], PreferencesController);
//# sourceMappingURL=preferences.controller.js.map