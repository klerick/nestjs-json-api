import { Migration } from '@mikro-orm/migrations';

export class Migration20251022143819_CreateDocumentAcl extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "acl_documents" ("id" serial primary key, "filename" varchar(255) not null, "mime_type" varchar(100) not null, "size" bigint not null, "path" varchar(500) not null, "owner_id" int not null, "shared_with" integer[] not null default '{}', "is_public" boolean not null default false, "uploaded_at" timestamp(0) without time zone not null default current_timestamp(0), "updated_at" timestamp(0) without time zone not null default current_timestamp(0));`);

    this.addSql(`alter table "acl_documents" add constraint "acl_documents_owner_id_foreign" foreign key ("owner_id") references "acl_users" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "acl_documents" cascade;`);
  }

}
