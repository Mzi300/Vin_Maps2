"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AILoadProtectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AILoadProtectionService = void 0;
const common_1 = require("@nestjs/common");
let AILoadProtectionService = AILoadProtectionService_1 = class AILoadProtectionService {
    logger = new common_1.Logger(AILoadProtectionService_1.name);
    concurrentExecutions = 0;
    MAX_CONCURRENT = 50;
    async executeProtected(operation) {
        if (this.concurrentExecutions >= this.MAX_CONCURRENT) {
            this.logger.warn(`AI Load Protection triggered! Max concurrent limit (${this.MAX_CONCURRENT}) reached. Forcing degraded mode.`);
            throw new Error('AI_LOAD_LIMIT_EXCEEDED');
        }
        this.concurrentExecutions++;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('AI_TIMEOUT')), 2000);
            });
            return await Promise.race([operation(), timeoutPromise]);
        }
        finally {
            this.concurrentExecutions--;
        }
    }
};
exports.AILoadProtectionService = AILoadProtectionService;
exports.AILoadProtectionService = AILoadProtectionService = AILoadProtectionService_1 = __decorate([
    (0, common_1.Injectable)()
], AILoadProtectionService);
//# sourceMappingURL=ai-load-protection.service.js.map