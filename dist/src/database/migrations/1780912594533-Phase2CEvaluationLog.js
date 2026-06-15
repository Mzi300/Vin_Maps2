"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase2CEvaluationLog1780912594533 = void 0;
class Phase2CEvaluationLog1780912594533 {
    name = 'Phase2CEvaluationLog1780912594533';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "model_evaluation_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "routeId" uuid NOT NULL, "predictedEta" double precision NOT NULL, "actualEta" double precision, "congestionPrediction" jsonb, "anomalyFlags" jsonb, "finalScore" double precision NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bf541cbe6510d3b35cd81525692" PRIMARY KEY ("id"))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "model_evaluation_logs"`);
    }
}
exports.Phase2CEvaluationLog1780912594533 = Phase2CEvaluationLog1780912594533;
//# sourceMappingURL=1780912594533-Phase2CEvaluationLog.js.map