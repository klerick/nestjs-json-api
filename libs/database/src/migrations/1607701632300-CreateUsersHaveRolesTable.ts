import {
  MigrationInterface,
  TableForeignKey,
  QueryRunner,
  TableColumn,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateUsersHaveRolesTable1607701632300 implements MigrationInterface {
  protected readonly tableName = 'users_have_roles';

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
            name: 'user_id',
            type: 'int',
            isNullable: false,
            unsigned: true,
          }),
          new TableColumn({
            name: 'role_id',
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
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            columnNames: ['user_id'],
          }),
          new TableForeignKey({
            referencedTableName: 'roles',
            referencedColumnNames: ['id'],
            columnNames: ['role_id'],
          }),
        ],
        indices: [
          new TableIndex({
            columnNames: ['user_id', 'role_id'],
            isUnique: true,
          }),
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
  }
}
