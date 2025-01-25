import { Migration } from '@mikro-orm/migrations';

export class Migration20250123124745_CreateUsersUsersRelations extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" add column "manager_id" int null;`);
    this.addSql(`alter table "users" add constraint "users_manager_id_foreign" foreign key ("manager_id") references "users" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "users" add constraint "users_manager_id_unique" unique ("manager_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop constraint "users_manager_id_foreign";`);

    this.addSql(`alter table "users" drop constraint "users_manager_id_unique";`);
    this.addSql(`alter table "users" drop column "manager_id";`);
  }

}
