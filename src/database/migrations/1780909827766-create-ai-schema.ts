import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAiSchema1780909827766 implements MigrationInterface {
    name = 'CreateAiSchema1780909827766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "route_usage_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "routeId" uuid NOT NULL, "distanceKm" double precision NOT NULL, "predictedEtaMinutes" integer NOT NULL, "actualEtaMinutes" integer, "ruleBasedScore" double precision NOT NULL, "mlAdjustmentScore" double precision NOT NULL, "efficiencyScore" double precision, "features" jsonb NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c214599f5cf5456029e5017cecb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1a019b14e1e556c76bf23ea5aa" ON "route_usage_logs"  ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8674abff2e0d8ee6ae75ee198e" ON "route_usage_logs"  ("routeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5f5ac749ca42063ffe27c9a5e4" ON "route_usage_logs"  ("timestamp") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5f5ac749ca42063ffe27c9a5e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8674abff2e0d8ee6ae75ee198e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a019b14e1e556c76bf23ea5aa"`);
        await queryRunner.query(`DROP TABLE "route_usage_logs"`);
    }

}
