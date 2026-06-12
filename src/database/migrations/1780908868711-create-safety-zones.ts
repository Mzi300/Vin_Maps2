import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSafetyZones1780908868711 implements MigrationInterface {
    name = 'CreateSafetyZones1780908868711'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."safety_zones_type_enum" AS ENUM('SCHOOL', 'CRIME', 'ENVIRONMENT')`);
        await queryRunner.query(`CREATE TYPE "public"."safety_zones_risklevel_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`);
        await queryRunner.query(`CREATE TABLE "safety_zones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."safety_zones_type_enum" NOT NULL, "riskLevel" "public"."safety_zones_risklevel_enum" NOT NULL, "boundary" geometry(Polygon,4326) NOT NULL, "description" character varying, "activeHours" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dc144c54db317b38735bdd0def0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1101e30655d8f6ca499ea21a0d" ON "safety_zones" USING gist ("boundary") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_1101e30655d8f6ca499ea21a0d"`);
        await queryRunner.query(`DROP TABLE "safety_zones"`);
        await queryRunner.query(`DROP TYPE "public"."safety_zones_risklevel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."safety_zones_type_enum"`);
    }

}
