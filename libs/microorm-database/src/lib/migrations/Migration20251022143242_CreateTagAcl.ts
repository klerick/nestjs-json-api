import { Migration } from '@mikro-orm/migrations';

export class Migration20251022143242_CreateTagAcl extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "acl_tags" ("id" serial primary key, "name" varchar(100) not null, "slug" varchar(150) not null, "created_by_id" int not null, "is_official" boolean not null default false, "description" text null, "created_at" timestamp(0) without time zone not null default current_timestamp(0), "updated_at" timestamp(0) without time zone not null default current_timestamp(0));`);
    this.addSql(`alter table "acl_tags" add constraint "acl_tags_slug_unique" unique ("slug");`);

    this.addSql(`create table "acl_posts_tags" ("post_acl_id" int not null, "tag_acl_id" int not null, constraint "acl_posts_tags_pkey" primary key ("post_acl_id", "tag_acl_id"));`);

    this.addSql(`alter table "acl_tags" add constraint "acl_tags_created_by_id_foreign" foreign key ("created_by_id") references "acl_users" ("id") on update cascade;`);

    this.addSql(`alter table "acl_posts_tags" add constraint "acl_posts_tags_post_acl_id_foreign" foreign key ("post_acl_id") references "acl_posts" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "acl_posts_tags" add constraint "acl_posts_tags_tag_acl_id_foreign" foreign key ("tag_acl_id") references "acl_tags" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "acl_posts_tags" drop constraint "acl_posts_tags_tag_acl_id_foreign";`);

    this.addSql(`drop table if exists "acl_tags" cascade;`);

    this.addSql(`drop table if exists "acl_posts_tags" cascade;`);
  }

}
