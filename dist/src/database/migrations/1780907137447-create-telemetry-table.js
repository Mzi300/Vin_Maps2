"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTelemetryTable1780907137447 = void 0;
class CreateTelemetryTable1780907137447 {
    name = 'CreateTelemetryTable1780907137447';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "vehicle_telemetry" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "location" geography(Point,4326) NOT NULL, "speed" double precision NOT NULL, "heading" double precision, "accuracy" double precision, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2251d5304256c01643d2d33903b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b50b40df68cb666d8a12e4c15f" ON "vehicle_telemetry"  ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_449223298cbd6f2c68a7711db6" ON "vehicle_telemetry" USING gist ("location") `);
        await queryRunner.query(`CREATE INDEX "IDX_e375dcaf50e0893cf4e1d4e01d" ON "vehicle_telemetry"  ("timestamp") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_e375dcaf50e0893cf4e1d4e01d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_449223298cbd6f2c68a7711db6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b50b40df68cb666d8a12e4c15f"`);
        await queryRunner.query(`DROP TABLE "vehicle_telemetry"`);
    }
}
exports.CreateTelemetryTable1780907137447 = CreateTelemetryTable1780907137447;
//# sourceMappingURL=1780907137447-create-telemetry-table.js.map