import { Migration } from '@mikro-orm/migrations';

export class Migration20251022143027_CreatePostAcl extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "acl_posts" ("id" serial primary key, "title" varchar(255) not null, "content" text not null, "excerpt" text null, "author_id" int not null, "category_id" int null, "status" text check ("status" in ('draft', 'published', 'archived')) not null, "is_published" boolean not null default false, "published_at" timestamp(0) without time zone null, "view_count" int not null default 0, "created_at" timestamp(0) without time zone not null default current_timestamp(0), "updated_at" timestamp(0) without time zone not null default current_timestamp(0));`);

    this.addSql(`alter table "acl_posts" add constraint "acl_posts_author_id_foreign" foreign key ("author_id") references "acl_users" ("id") on update cascade;`);
    this.addSql(`alter table "acl_posts" add constraint "acl_posts_category_id_foreign" foreign key ("category_id") references "acl_categories" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "acl_posts" cascade;`);
  }

}
