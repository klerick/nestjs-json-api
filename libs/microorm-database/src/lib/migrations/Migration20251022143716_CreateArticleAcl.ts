import { Migration } from '@mikro-orm/migrations';

export class Migration20251022143716_CreateArticleAcl extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "acl_articles" ("id" serial primary key, "title" varchar(255) not null, "content" text not null, "author_id" int not null, "co_author_ids" integer[] not null default '{}', "editor_id" int null, "status" text check ("status" in ('draft', 'review', 'published')) not null, "visibility" text check ("visibility" in ('public', 'private', 'unlisted')) not null, "metadata" jsonb not null default '{"readTime": 0, "featured": false, "premium": false}', "published_at" timestamp(0) without time zone null, "expires_at" timestamp(0) without time zone null, "created_at" timestamp(0) without time zone not null default current_timestamp(0), "updated_at" timestamp(0) without time zone not null default current_timestamp(0));`);

    this.addSql(`alter table "acl_articles" add constraint "acl_articles_author_id_foreign" foreign key ("author_id") references "acl_users" ("id") on update cascade;`);
    this.addSql(`alter table "acl_articles" add constraint "acl_articles_editor_id_foreign" foreign key ("editor_id") references "acl_users" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "acl_articles" cascade;`);
  }

}
