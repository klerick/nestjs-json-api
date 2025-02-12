import { Migration } from '@mikro-orm/migrations';

export class Migration20250123131039_CreateBookListTable extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create extension if not exists "uuid-ossp";`);
    this.addSql(
      `create table "book_list" ("id" uuid not null default uuid_generate_v4(), "text" text not null, "created_at" timestamp(0) without time zone null default current_timestamp(0), "updated_at" timestamp(0) without time zone null default current_timestamp(0), constraint "book_list_pkey" primary key ("id"));`
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "book_list" cascade;`);
  }
}
