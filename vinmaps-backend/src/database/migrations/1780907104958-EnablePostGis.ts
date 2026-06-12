import { MigrationInterface, QueryRunner } from "typeorm";

export class EnablePostGis1780907104958 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
