import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddPreferencesTable1623456789012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'preferences',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'userId', type: 'uuid' },
          { name: 'avoidTolls', type: 'boolean', default: false },
          { name: 'preferredSpeedKmh', type: 'int', default: 80 },
          { name: 'vehicleType', type: 'varchar', length: 20, default: `'car'` },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' }
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('preferences');
  }
}
