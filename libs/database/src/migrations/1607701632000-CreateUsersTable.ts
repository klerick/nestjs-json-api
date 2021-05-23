import {
  MigrationInterface,
  TableForeignKey,
  QueryRunner,
  TableColumn,
  Table,
} from 'typeorm';

export class CreateUsersTable1607701632000 implements MigrationInterface {
  protected readonly tableName = 'users';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
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
            name: 'login',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          }),
          new TableColumn({
            name: 'first_name',
            type: 'varchar',
            isNullable: true,
            default: 'NULL',
          }),
          new TableColumn({
            name: 'last_name',
            type: 'varchar',
            isNullable: true,
            default: 'NULL',
          }),
          new TableColumn({
            name: 'is_active',
            type: 'boolean',
            width: 1,
            isNullable: true,
            default: false,
          }),
          new TableColumn({
            name: 'manager_id',
            type: 'int',
            isNullable: true,
            unsigned: true,
            default: 'NULL',
          }),
          new TableColumn({
            name: 'addresses_id',
            type: 'int',
            isNullable: false,
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
            referencedTableName: 'addresses',
            referencedColumnNames: ['id'],
            columnNames: ['addresses_id'],
          }),
          new TableForeignKey({
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            columnNames: ['manager_id'],
          }),
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
  }
}
