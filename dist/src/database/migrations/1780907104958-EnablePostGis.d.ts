import { MigrationInterface, QueryRunner } from "typeorm";
export declare class EnablePostGis1780907104958 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
