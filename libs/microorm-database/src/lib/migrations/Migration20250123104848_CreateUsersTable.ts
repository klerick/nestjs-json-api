import { Migration } from '@mikro-orm/migrations';

export class Migration20250123104848_CreateUsersTable extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "users" ("id" serial primary key, "login" varchar(100) not null, "first_name" varchar(100) null default 'NULL', "last_name" varchar(100) null default 'NULL', "is_active" boolean null default false, "created_at" timestamp(0) without time zone null default current_timestamp(0), "updated_at" timestamp(0) without time zone null default current_timestamp(0));`);
    this.addSql(`alter table "users" add constraint "users_login_unique" unique ("login");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "users" cascade;`);
  }

}
