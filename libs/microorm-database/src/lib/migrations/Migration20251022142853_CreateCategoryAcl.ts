import { Migration } from '@mikro-orm/migrations';

export class Migration20251022142853_CreateCategoryAcl extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "acl_categories" ("id" serial primary key, "name" varchar(100) not null, "slug" varchar(150) not null, "parent_id" int null, "level" int not null default 0, "is_active" boolean not null default true, "description" text null, "created_at" timestamp(0) without time zone not null default current_timestamp(0), "updated_at" timestamp(0) without time zone not null default current_timestamp(0));`);
    this.addSql(`alter table "acl_categories" add constraint "acl_categories_slug_unique" unique ("slug");`);

    this.addSql(`alter table "acl_categories" add constraint "acl_categories_parent_id_foreign" foreign key ("parent_id") references "acl_categories" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "acl_categories" drop constraint "acl_categories_parent_id_foreign";`);

    this.addSql(`drop table if exists "acl_categories" cascade;`);
  }

}
