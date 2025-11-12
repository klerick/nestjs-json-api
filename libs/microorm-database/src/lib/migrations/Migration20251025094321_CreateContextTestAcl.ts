import { Migration } from '@mikro-orm/migrations';

export class Migration20251025094321_CreateContextTestAcl extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "acl_context_test" ("id" serial primary key, "acl_rules" jsonb not null default '{}', "context" jsonb not null default '{}');`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "acl_context_test" cascade;`);
  }

}
