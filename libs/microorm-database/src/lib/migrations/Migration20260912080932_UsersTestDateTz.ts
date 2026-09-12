import { Migration } from '@mikro-orm/migrations';

export class Migration20260912080932_UsersTestDateTz extends Migration {

  override name = 'Migration20260912080932_UsersTestDateTz';

  override up(): void | Promise<void> {
    this.addSql(`alter table "users" add "test_date_tz" timestamp(0) with time zone null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "users" drop column "test_date_tz";`);
  }

}
