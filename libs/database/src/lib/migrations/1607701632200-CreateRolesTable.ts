import { MigrationInterface, QueryRunner, TableColumn, Table } from 'typeorm';
import { Roles } from '../entities';

export enum RoleKeys {
  ReadOnly = 'READ_ONLY',
  User = 'USER',
  Administrator = 'ADMINISTRATOR'
}

export class CreateRolesTable1607701632200 implements MigrationInterface {
  protected readonly tableName = 'roles';

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
            name: 'name',
            type: 'varchar',
            length: '128',
            isNullable: true,
            default: 'NULL',
          }),
          new TableColumn({
            name: 'key',
            type: 'varchar',
            length: '128',
            isNullable: false,
            isUnique: true,
          }),
          new TableColumn({
            name: 'is_default',
            type: 'boolean',
            width: 1,
            isNullable: true,
            default: false,
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

    const repo = queryRunner.manager.getRepository(Roles);
    const roles = {
      readOnly: new Roles(),
      user: new Roles(),
      admin: new Roles(),
    };

    roles.readOnly.name = 'Read Only';
    roles.readOnly.key = RoleKeys.ReadOnly;

    roles.user.name = 'User';
    roles.user.key = RoleKeys.User;
    roles.user.isDefault = true;

    roles.admin.name = 'Administrator';
    roles.admin.key = RoleKeys.Administrator;


    await repo.save(Object.values(roles), { reload: false });

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.tableName);
  }
}
