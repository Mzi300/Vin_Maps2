import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CreateSafetyZones1780908868711 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
