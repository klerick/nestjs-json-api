import { Migration } from '@mikro-orm/migrations';

export class Migration20251022142746_CreateUserProfileAcl extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "acl_user_profiles" ("id" serial primary key, "user_id" int not null, "first_name" varchar(100) null, "last_name" varchar(100) null, "bio" text null, "avatar" varchar(255) null, "phone" varchar(200) null, "salary" numeric(10,2) null, "is_public" boolean not null default true, "role" text check ("role" in ('admin', 'user', 'moderator')) not null, "created_at" timestamp(0) without time zone not null default current_timestamp(0), "updated_at" timestamp(0) without time zone not null default current_timestamp(0));`);
    this.addSql(`alter table "acl_user_profiles" add constraint "acl_user_profiles_user_id_unique" unique ("user_id");`);

    this.addSql(`alter table "acl_user_profiles" add constraint "acl_user_profiles_user_id_foreign" foreign key ("user_id") references "acl_users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "acl_user_profiles" cascade;`);
  }

}
