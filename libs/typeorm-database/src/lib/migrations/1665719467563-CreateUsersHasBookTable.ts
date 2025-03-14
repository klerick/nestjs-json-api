import {
  MigrationInterface,
  TableForeignKey,
  QueryRunner,
  TableColumn,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateUsersHaveBookTable1665719467563
  implements MigrationInterface
{
  protected readonly tableName = 'users_have_book';

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
            name: 'users_id',
            type: 'int',
            isNullable: false,
            unsigned: true,
          }),
          new TableColumn({
            name: 'book_list_id',
            type: 'uuid',
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
            columnNames: ['users_id'],
          }),
          new TableForeignKey({
            referencedTableName: 'book_list',
            referencedColumnNames: ['id'],
            columnNames: ['book_list_id'],
          }),
        ],
        indices: [
          new TableIndex({
            columnNames: ['users_id', 'book_list_id'],
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
