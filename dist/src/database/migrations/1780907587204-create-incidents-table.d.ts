import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CreateIncidentsTable1780907587204 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
