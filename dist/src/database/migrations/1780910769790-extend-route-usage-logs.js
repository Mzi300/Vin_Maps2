"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendRouteUsageLogs1780910769790 = void 0;
class ExtendRouteUsageLogs1780910769790 {
    name = 'ExtendRouteUsageLogs1780910769790';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ADD "startTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ADD "endTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ADD "predictedSafetyScore" double precision`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ADD "actualEvents" jsonb`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ADD "congestionLevel" integer`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ADD "routeScoreInputs" jsonb`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ALTER COLUMN "ruleBasedScore" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ALTER COLUMN "mlAdjustmentScore" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ALTER COLUMN "features" DROP NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ALTER COLUMN "features" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ALTER COLUMN "mlAdjustmentScore" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ALTER COLUMN "ruleBasedScore" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" DROP COLUMN "routeScoreInputs"`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" DROP COLUMN "congestionLevel"`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" DROP COLUMN "actualEvents"`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" DROP COLUMN "predictedSafetyScore"`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" DROP COLUMN "endTime"`);
        await queryRunner.query(`ALTER TABLE "route_usage_logs" DROP COLUMN "startTime"`);
    }
}
exports.ExtendRouteUsageLogs1780910769790 = ExtendRouteUsageLogs1780910769790;
//# sourceMappingURL=1780910769790-extend-route-usage-logs.js.map