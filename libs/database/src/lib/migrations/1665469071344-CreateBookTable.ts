import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class CreateCommentsTable1665469071344 implements MigrationInterface {
  protected readonly tableName = 'book_list';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          new TableColumn({
            name: 'id',
            type: 'uuid',
            isGenerated: true,
            isPrimary: true,
            unsigned: true,
            generationStrategy: 'uuid',
          }),
          new TableColumn({
            name: 'text',
            type: 'text',
            isNullable: false,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
  }
}
