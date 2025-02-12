import { Migration } from '@mikro-orm/migrations';

export class Migration20250123110115_CreateRolesTable extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "roles" ("id" serial primary key, "name" varchar(128) null default 'NULL', "key" varchar(128) not null, "is_default" boolean not null default 'false', "created_at" timestamp(0) without time zone null default current_timestamp(0), "updated_at" timestamp(0) without time zone null default current_timestamp(0));`);
    this.addSql(`alter table "roles" add constraint "roles_key_unique" unique ("key");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "roles" cascade;`);
  }

}
