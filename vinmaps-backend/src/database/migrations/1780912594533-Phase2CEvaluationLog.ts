import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase2CEvaluationLog1780912594533 implements MigrationInterface {
    name = 'Phase2CEvaluationLog1780912594533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "model_evaluation_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "routeId" uuid NOT NULL, "predictedEta" double precision NOT NULL, "actualEta" double precision, "congestionPrediction" jsonb, "anomalyFlags" jsonb, "finalScore" double precision NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bf541cbe6510d3b35cd81525692" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "model_evaluation_logs"`);
    }

}
