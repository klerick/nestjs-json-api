import { Migration } from '@mikro-orm/migrations';

export class Migration20260912082242_AlignForeignKeys extends Migration {

  override name = 'Migration20260912082242_AlignForeignKeys';

  override up(): void | Promise<void> {
    this.addSql(`alter table "acl_categories" drop constraint "acl_categories_parent_id_foreign";`);

    this.addSql(`alter table "users" drop constraint "users_addresses_id_foreign";`);
    this.addSql(`alter table "users" drop constraint "users_manager_id_foreign";`);

    this.addSql(`alter table "comments" drop constraint "comments_created_by_foreign";`);

    this.addSql(`alter table "acl_user_profiles" drop constraint "acl_user_profiles_user_id_foreign";`);

    this.addSql(`alter table "acl_tags" drop constraint "acl_tags_created_by_id_foreign";`);

    this.addSql(`alter table "acl_posts" drop constraint "acl_posts_author_id_foreign";`);
    this.addSql(`alter table "acl_posts" drop constraint "acl_posts_category_id_foreign";`);

    this.addSql(`alter table "acl_documents" drop constraint "acl_documents_owner_id_foreign";`);

    this.addSql(`alter table "acl_comments" drop constraint "acl_comments_author_id_foreign";`);
    this.addSql(`alter table "acl_comments" drop constraint "acl_comments_post_id_foreign";`);

    this.addSql(`alter table "acl_articles" drop constraint "acl_articles_author_id_foreign";`);
    this.addSql(`alter table "acl_articles" drop constraint "acl_articles_editor_id_foreign";`);

    this.addSql(`alter table "acl_categories" add constraint "acl_categories_parent_id_foreign" foreign key ("parent_id") references "acl_categories" ("id") on delete set null;`);

    this.addSql(`alter table "users" add constraint "users_addresses_id_foreign" foreign key ("addresses_id") references "addresses" ("id");`);
    this.addSql(`alter table "users" add constraint "users_manager_id_foreign" foreign key ("manager_id") references "users" ("id") on delete set null;`);

    this.addSql(`alter table "comments" add constraint "comments_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on delete set null;`);

    this.addSql(`alter table "acl_user_profiles" add constraint "acl_user_profiles_user_id_foreign" foreign key ("user_id") references "acl_users" ("id");`);

    this.addSql(`alter table "acl_tags" add constraint "acl_tags_created_by_id_foreign" foreign key ("created_by_id") references "acl_users" ("id");`);

    this.addSql(`alter table "acl_posts" add constraint "acl_posts_author_id_foreign" foreign key ("author_id") references "acl_users" ("id");`);
    this.addSql(`alter table "acl_posts" add constraint "acl_posts_category_id_foreign" foreign key ("category_id") references "acl_categories" ("id") on delete set null;`);

    this.addSql(`alter table "acl_documents" add constraint "acl_documents_owner_id_foreign" foreign key ("owner_id") references "acl_users" ("id");`);

    this.addSql(`alter table "acl_comments" add constraint "acl_comments_author_id_foreign" foreign key ("author_id") references "acl_users" ("id");`);
    this.addSql(`alter table "acl_comments" add constraint "acl_comments_post_id_foreign" foreign key ("post_id") references "acl_posts" ("id");`);

    this.addSql(`alter table "acl_articles" add constraint "acl_articles_author_id_foreign" foreign key ("author_id") references "acl_users" ("id");`);
    this.addSql(`alter table "acl_articles" add constraint "acl_articles_editor_id_foreign" foreign key ("editor_id") references "acl_users" ("id") on delete set null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "acl_articles" drop constraint "acl_articles_author_id_foreign";`);
    this.addSql(`alter table "acl_articles" drop constraint "acl_articles_editor_id_foreign";`);

    this.addSql(`alter table "acl_categories" drop constraint "acl_categories_parent_id_foreign";`);

    this.addSql(`alter table "acl_comments" drop constraint "acl_comments_post_id_foreign";`);
    this.addSql(`alter table "acl_comments" drop constraint "acl_comments_author_id_foreign";`);

    this.addSql(`alter table "acl_documents" drop constraint "acl_documents_owner_id_foreign";`);

    this.addSql(`alter table "acl_posts" drop constraint "acl_posts_author_id_foreign";`);
    this.addSql(`alter table "acl_posts" drop constraint "acl_posts_category_id_foreign";`);

    this.addSql(`alter table "acl_tags" drop constraint "acl_tags_created_by_id_foreign";`);

    this.addSql(`alter table "acl_user_profiles" drop constraint "acl_user_profiles_user_id_foreign";`);

    this.addSql(`alter table "comments" drop constraint "comments_created_by_id_foreign";`);

    this.addSql(`alter table "users" drop constraint "users_addresses_id_foreign";`);
    this.addSql(`alter table "users" drop constraint "users_manager_id_foreign";`);

    this.addSql(`alter table "acl_articles" add constraint "acl_articles_author_id_foreign" foreign key ("author_id") references "acl_users" ("id") on update cascade;`);
    this.addSql(`alter table "acl_articles" add constraint "acl_articles_editor_id_foreign" foreign key ("editor_id") references "acl_users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "acl_categories" add constraint "acl_categories_parent_id_foreign" foreign key ("parent_id") references "acl_categories" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "acl_comments" add constraint "acl_comments_post_id_foreign" foreign key ("post_id") references "acl_posts" ("id") on update cascade;`);
    this.addSql(`alter table "acl_comments" add constraint "acl_comments_author_id_foreign" foreign key ("author_id") references "acl_users" ("id") on update cascade;`);

    this.addSql(`alter table "acl_documents" add constraint "acl_documents_owner_id_foreign" foreign key ("owner_id") references "acl_users" ("id") on update cascade;`);

    this.addSql(`alter table "acl_posts" add constraint "acl_posts_author_id_foreign" foreign key ("author_id") references "acl_users" ("id") on update cascade;`);
    this.addSql(`alter table "acl_posts" add constraint "acl_posts_category_id_foreign" foreign key ("category_id") references "acl_categories" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "acl_tags" add constraint "acl_tags_created_by_id_foreign" foreign key ("created_by_id") references "acl_users" ("id") on update cascade;`);

    this.addSql(`alter table "acl_user_profiles" add constraint "acl_user_profiles_user_id_foreign" foreign key ("user_id") references "acl_users" ("id") on update cascade;`);

    this.addSql(`alter table "comments" add constraint "comments_created_by_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "users" add constraint "users_addresses_id_foreign" foreign key ("addresses_id") references "addresses" ("id") on update cascade;`);
    this.addSql(`alter table "users" add constraint "users_manager_id_foreign" foreign key ("manager_id") references "users" ("id") on update cascade on delete set null;`);
  }

}
