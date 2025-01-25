import { Migration } from '@mikro-orm/migrations';

export class Migration20250123111042_CreateCommentsTable extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create type "comment_kind_enum" as enum ('COMMENT', 'MESSAGE', 'NOTE');`);
    this.addSql(`create table "comments" ("id" serial primary key, "text" text not null, "kind" "comment_kind_enum" not null, "created_at" timestamp(0) without time zone null default current_timestamp(0), "updated_at" timestamp(0) without time zone null default current_timestamp(0));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "comments" cascade;`);

    this.addSql(`drop type "comment_kind_enum";`);
  }

}
