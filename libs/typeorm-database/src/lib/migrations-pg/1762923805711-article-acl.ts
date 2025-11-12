import { MigrationInterface, QueryRunner } from "typeorm";

export class ArticleAcl1762923805711 implements MigrationInterface {
    name = 'ArticleAcl1762923805711'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."acl_articles_status_enum" AS ENUM('draft', 'review', 'published')`);
        await queryRunner.query(`CREATE TYPE "public"."acl_articles_visibility_enum" AS ENUM('public', 'private', 'unlisted')`);
        await queryRunner.query(`CREATE TABLE "acl_articles" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "content" text NOT NULL, "co_author_ids" integer array NOT NULL DEFAULT '{}', "status" "public"."acl_articles_status_enum" NOT NULL DEFAULT 'draft', "visibility" "public"."acl_articles_visibility_enum" NOT NULL DEFAULT 'public', "metadata" json NOT NULL DEFAULT '{"readTime": 0, "featured": false, "premium": false}', "published_at" TIMESTAMP, "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "author_id" integer NOT NULL, "editor_id" integer, CONSTRAINT "PK_a8b46052028c40ef71a8d0dec46" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "acl_articles" ADD CONSTRAINT "FK_d533de0d25e82f813452d6b1a00" FOREIGN KEY ("author_id") REFERENCES "acl_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "acl_articles" ADD CONSTRAINT "FK_737a198380679073248993f08b8" FOREIGN KEY ("editor_id") REFERENCES "acl_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "acl_articles" DROP CONSTRAINT "FK_737a198380679073248993f08b8"`);
        await queryRunner.query(`ALTER TABLE "acl_articles" DROP CONSTRAINT "FK_d533de0d25e82f813452d6b1a00"`);
        await queryRunner.query(`DROP TABLE "acl_articles"`);
        await queryRunner.query(`DROP TYPE "public"."acl_articles_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."acl_articles_status_enum"`);
    }

}
