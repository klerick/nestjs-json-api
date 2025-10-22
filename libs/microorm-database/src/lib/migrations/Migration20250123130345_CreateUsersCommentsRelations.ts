import { Migration } from '@mikro-orm/migrations';

export class Migration20250123130345_CreateUsersCommentsRelations extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "comments" add column "created_by" int;`);
    this.addSql(`alter table "comments" add constraint "comments_created_by_foreign" foreign key ("created_by") references "users" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "comments" drop constraint "comments_created_by_foreign";`);

    this.addSql(`alter table "comments" drop column "created_by";`);
  }

}
