"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPreferencesTable1623456789012 = void 0;
const typeorm_1 = require("typeorm");
class AddPreferencesTable1623456789012 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
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
        }), true);
    }
    async down(queryRunner) {
        await queryRunner.dropTable('preferences');
    }
}
exports.AddPreferencesTable1623456789012 = AddPreferencesTable1623456789012;
//# sourceMappingURL=1623456789012-AddPreferencesTable.js.map