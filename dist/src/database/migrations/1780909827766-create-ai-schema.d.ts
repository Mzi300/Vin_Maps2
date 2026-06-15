import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CreateAiSchema1780909827766 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
