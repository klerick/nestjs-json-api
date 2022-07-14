import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  Table,
  TableForeignKey, TableIndex
} from 'typeorm';

export class PodsTestTable1607701632700 implements MigrationInterface {
  protected readonly tableName = 'comments';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'requests',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'int',
            isGenerated: true,
            isPrimary: true,
            unsigned: true,
            generationStrategy: 'increment',
          }),
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            isNullable: true,
            default: 'CURRENT_TIMESTAMP',
          }),
          new TableColumn({
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
            default: 'CURRENT_TIMESTAMP',
          }),
        ],
      })
    );
    await queryRunner.createTable(
      new Table({
        name: 'pods',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'int',
            isGenerated: true,
            isPrimary: true,
            unsigned: true,
            generationStrategy: 'increment',
          }),
          new TableColumn({
            name: 'name',
            type: 'varchar',
            isNullable: true,
            default: 'NULL',
          }),
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            isNullable: true,
            default: 'CURRENT_TIMESTAMP',
          }),
          new TableColumn({
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
            default: 'CURRENT_TIMESTAMP',
          }),
        ],
      })
    );
    await queryRunner.createTable(
      new Table({
        name: 'requests_have_pod_locks',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'int',
            isGenerated: true,
            isPrimary: true,
            unsigned: true,
            generationStrategy: 'increment',
          }),
          new TableColumn({
            name: 'request_id',
            type: 'int',
            isNullable: false,
            unsigned: true,
          }),
          new TableColumn({
            name: 'pod_id',
            type: 'int',
            isNullable: false,
            unsigned: true,
          }),
          new TableColumn({
            name: 'external_id',
            type: 'int',
            isNullable: true,
            unsigned: true,
          }),
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            isNullable: true,
            default: 'CURRENT_TIMESTAMP',
          }),
          new TableColumn({
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
            default: 'CURRENT_TIMESTAMP',
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            referencedTableName: 'requests',
            referencedColumnNames: ['id'],
            columnNames: ['request_id'],
          }),
          new TableForeignKey({
            referencedTableName: 'pods',
            referencedColumnNames: ['id'],
            columnNames: ['pod_id'],
          }),
        ],
        indices: [
          new TableIndex({
            columnNames: ['request_id', 'pod_id'],
            isUnique: true,
          }),
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('requests');
    await queryRunner.dropTable('pods');
    await queryRunner.dropTable('requests_have_pod_locks');
  }
}
