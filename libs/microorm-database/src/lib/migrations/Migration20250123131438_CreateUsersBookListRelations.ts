import { Migration } from '@mikro-orm/migrations';

export class Migration20250123131438_CreateUsersBookListRelations extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "users_have_book" ("users_id" int not null, "book_list_id" uuid not null, constraint "users_have_book_pkey" primary key ("users_id", "book_list_id"));`);

    this.addSql(`alter table "users_have_book" add constraint "users_have_book_users_id_foreign" foreign key ("users_id") references "users" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "users_have_book" add constraint "users_have_book_book_list_id_foreign" foreign key ("book_list_id") references "book_list" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "users_have_book" cascade;`);
  }

}
