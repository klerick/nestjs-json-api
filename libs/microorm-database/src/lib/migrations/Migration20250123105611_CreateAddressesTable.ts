import { Migration } from '@mikro-orm/migrations';

export class Migration20250123105611_CreateAddressesTable extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "addresses" ("id" serial primary key, "city" varchar(70) null, "state" varchar(70) null, "country" varchar(68) null, "created_at" timestamp(0) without time zone null default current_timestamp(0), "updated_at" timestamp(0) without time zone null default current_timestamp(0));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "addresses" cascade;`);
  }

}
