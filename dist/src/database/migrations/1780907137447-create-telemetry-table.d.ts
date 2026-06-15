import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CreateTelemetryTable1780907137447 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
