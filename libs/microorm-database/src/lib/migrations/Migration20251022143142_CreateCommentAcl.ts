import { Migration } from '@mikro-orm/migrations';

export class Migration20251022143142_CreateCommentAcl extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "acl_comments" ("id" serial primary key, "post_id" int not null, "author_id" int not null, "content" text not null, "is_approved" boolean not null default false, "is_edited" boolean not null default false, "created_at" timestamp(0) without time zone not null default current_timestamp(0), "updated_at" timestamp(0) without time zone not null default current_timestamp(0));`);

    this.addSql(`alter table "acl_comments" add constraint "acl_comments_post_id_foreign" foreign key ("post_id") references "acl_posts" ("id") on update cascade;`);
    this.addSql(`alter table "acl_comments" add constraint "acl_comments_author_id_foreign" foreign key ("author_id") references "acl_users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "acl_comments" cascade;`);
  }

}
