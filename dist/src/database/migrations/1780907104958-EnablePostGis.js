"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnablePostGis1780907104958 = void 0;
class EnablePostGis1780907104958 {
    async up(queryRunner) {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis');
    }
    async down(queryRunner) {
    }
}
exports.EnablePostGis1780907104958 = EnablePostGis1780907104958;
//# sourceMappingURL=1780907104958-EnablePostGis.js.map