"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateIncidentsTable1780907587204 = void 0;
class CreateIncidentsTable1780907587204 {
    name = 'CreateIncidentsTable1780907587204';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."incidents_type_enum" AS ENUM('POTHOLE', 'ACCIDENT', 'ROAD_HAZARD', 'ROAD_CLOSURE', 'FLOOD', 'BROKEN_TRAFFIC_LIGHT', 'POLICE_CHECKPOINT', 'CONSTRUCTION')`);
        await queryRunner.query(`CREATE TYPE "public"."incidents_severity_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`);
        await queryRunner.query(`CREATE TYPE "public"."incidents_status_enum" AS ENUM('PENDING', 'VERIFIED', 'REJECTED', 'RESOLVED')`);
        await queryRunner.query(`CREATE TABLE "incidents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reporterId" uuid NOT NULL, "type" "public"."incidents_type_enum" NOT NULL, "severity" "public"."incidents_severity_enum" NOT NULL DEFAULT 'MEDIUM', "status" "public"."incidents_status_enum" NOT NULL DEFAULT 'PENDING', "location" geography(Point,4326) NOT NULL, "description" character varying, "mediaUrl" character varying, "verificationScore" integer NOT NULL DEFAULT '0', "reportCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ccb34c01719889017e2246469f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eb4eedb4f8cf4e58b66857067f" ON "incidents"  ("reporterId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4d0b572cc18218fc59653a4b63" ON "incidents"  ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_6fa7e61c79777de95b6a4ecd63" ON "incidents"  ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c566d3b2ca76f043a2da59359a" ON "incidents" USING gist ("location") `);
        await queryRunner.query(`CREATE INDEX "IDX_d1310b103b5d1d60aa718ba421" ON "incidents"  ("createdAt") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_d1310b103b5d1d60aa718ba421"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c566d3b2ca76f043a2da59359a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6fa7e61c79777de95b6a4ecd63"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4d0b572cc18218fc59653a4b63"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb4eedb4f8cf4e58b66857067f"`);
        await queryRunner.query(`DROP TABLE "incidents"`);
        await queryRunner.query(`DROP TYPE "public"."incidents_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."incidents_severity_enum"`);
        await queryRunner.query(`DROP TYPE "public"."incidents_type_enum"`);
    }
}
exports.CreateIncidentsTable1780907587204 = CreateIncidentsTable1780907587204;
//# sourceMappingURL=1780907587204-create-incidents-table.js.map