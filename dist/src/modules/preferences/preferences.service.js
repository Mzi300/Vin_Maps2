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
exports.PreferencesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const preference_entity_1 = require("./entities/preference.entity");
let PreferencesService = class PreferencesService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async create(userId, dto) {
        const pref = this.repo.create({ ...dto, user: { id: userId } });
        return this.repo.save(pref);
    }
    async findOne(userId) {
        const pref = await this.repo.findOne({ where: { user: { id: userId } } });
        if (!pref)
            throw new common_1.NotFoundException('Preferences not found');
        return pref;
    }
    async update(userId, dto) {
        const pref = await this.findOne(userId);
        Object.assign(pref, dto);
        return this.repo.save(pref);
    }
};
exports.PreferencesService = PreferencesService;
exports.PreferencesService = PreferencesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(preference_entity_1.Preference)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PreferencesService);
//# sourceMappingURL=preferences.service.js.map