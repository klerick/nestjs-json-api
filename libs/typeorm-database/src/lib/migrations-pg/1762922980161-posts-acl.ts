import { MigrationInterface, QueryRunner } from "typeorm";

export class PostsAcl1762922980161 implements MigrationInterface {
    name = 'PostsAcl1762922980161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."acl_posts_status_enum" AS ENUM('draft', 'published', 'archived')`);
        await queryRunner.query(`CREATE TABLE "acl_posts" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "content" text NOT NULL, "excerpt" text, "status" "public"."acl_posts_status_enum" NOT NULL DEFAULT 'draft', "is_published" boolean NOT NULL DEFAULT false, "published_at" TIMESTAMP, "view_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "author_id" integer NOT NULL, "category_id" integer, CONSTRAINT "PK_f71a42818c5da397f1b18b33ca7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "acl_posts" ADD CONSTRAINT "FK_49095f8d8388105d54529ead932" FOREIGN KEY ("author_id") REFERENCES "acl_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "acl_posts" ADD CONSTRAINT "FK_24fc3ee66b45e3d6eb1dd0a1204" FOREIGN KEY ("category_id") REFERENCES "acl_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "acl_posts" DROP CONSTRAINT "FK_24fc3ee66b45e3d6eb1dd0a1204"`);
        await queryRunner.query(`ALTER TABLE "acl_posts" DROP CONSTRAINT "FK_49095f8d8388105d54529ead932"`);
        await queryRunner.query(`DROP TABLE "acl_posts"`);
        await queryRunner.query(`DROP TYPE "public"."acl_posts_status_enum"`);
    }

}
