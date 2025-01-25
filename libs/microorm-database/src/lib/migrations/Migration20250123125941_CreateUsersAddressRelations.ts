import { Migration } from '@mikro-orm/migrations';

export class Migration20250123125941_CreateUsersAddressRelations extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" add column "addresses_id" int not null;`);
    this.addSql(`alter table "users" add constraint "users_addresses_id_foreign" foreign key ("addresses_id") references "addresses" ("id") on update cascade;`);
    this.addSql(`alter table "users" add constraint "users_addresses_id_unique" unique ("addresses_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop constraint "users_addresses_id_foreign";`);

    this.addSql(`alter table "users" drop constraint "users_addresses_id_unique";`);
    this.addSql(`alter table "users" drop column "addresses_id";`);
  }

}
