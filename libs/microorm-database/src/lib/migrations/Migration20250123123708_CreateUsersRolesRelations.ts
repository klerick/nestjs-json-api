import { Migration } from '@mikro-orm/migrations';

export class Migration20250123123708_CreateUsersRolesRelations extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "users_have_roles" ("users_id" int not null, "roles_id" int not null, constraint "users_have_roles_pkey" primary key ("users_id", "roles_id"));`
    );

    this.addSql(
      `alter table "users_have_roles" add constraint "users_have_roles_users_id_foreign" foreign key ("users_id") references "users" ("id") on update cascade on delete cascade;`
    );
    this.addSql(
      `alter table "users_have_roles" add constraint "users_have_roles_roles_id_foreign" foreign key ("roles_id") references "roles" ("id") on update cascade on delete cascade;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "users_have_roles" cascade;`);
  }
}
