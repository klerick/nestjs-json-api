import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateCommentsTable1607701632600 implements MigrationInterface {
  protected readonly tableName = 'comments';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TYPE "comment_kind_enum" AS ENUM('COMMENT', 'MESSAGE', 'NOTE')
    `);

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
            name: 'text',
            type: 'text',
            isNullable: false,
          }),
          new TableColumn({
            name: 'kind',
            type: 'comment_kind_enum',
            isNullable: false,
          }),
          new TableColumn({
            name: 'created_by',
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
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            columnNames: ['created_by'],
          }),
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
    await queryRunner.query('DROP TYPE IF EXISTS comment_kind_enum');
  }
}
