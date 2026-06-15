import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CreateUsersTable1780906661901 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
