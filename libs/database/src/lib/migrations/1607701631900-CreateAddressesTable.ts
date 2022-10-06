import { MigrationInterface, QueryRunner, TableColumn, Table } from 'typeorm';

export class CreateAddressesTable1607701632000 implements MigrationInterface {
  protected readonly tableName = 'addresses';

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
            name: 'city',
            type: 'varchar',
            length: '70',
            isNullable: true,
            default: 'NULL',
          }),
          new TableColumn({
            name: 'state',
            type: 'varchar',
            length: '70',
            isNullable: true,
            default: 'NULL',
          }),
          new TableColumn({
            name: 'country',
            type: 'varchar',
            length: '70',
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
  }
}
