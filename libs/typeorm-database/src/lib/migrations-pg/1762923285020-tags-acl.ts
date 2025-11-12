import { MigrationInterface, QueryRunner } from "typeorm";

export class TagsAcl1762923285020 implements MigrationInterface {
    name = 'TagsAcl1762923285020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "acl_tags" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "slug" character varying(150) NOT NULL, "is_official" boolean NOT NULL DEFAULT false, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" integer NOT NULL, CONSTRAINT "UQ_cb73dec75e13f6ca0cc53c7e119" UNIQUE ("slug"), CONSTRAINT "PK_0cd59c8ea9b729cb8bbadd0f1c1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "acl_posts_tags" ("post_acl_id" integer NOT NULL, "tag_acl_id" integer NOT NULL, CONSTRAINT "PK_976ceb7a24b7a17f7d99c038197" PRIMARY KEY ("post_acl_id", "tag_acl_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bbf500a1b01d7109b7a0b2bdcc" ON "acl_posts_tags" ("post_acl_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5b2cc57430f349c4bb4867f66e" ON "acl_posts_tags" ("tag_acl_id") `);
        await queryRunner.query(`ALTER TABLE "acl_tags" ADD CONSTRAINT "FK_d1c608d057ce31dfea67a9a7049" FOREIGN KEY ("created_by_id") REFERENCES "acl_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "acl_posts_tags" ADD CONSTRAINT "FK_bbf500a1b01d7109b7a0b2bdcc4" FOREIGN KEY ("post_acl_id") REFERENCES "acl_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "acl_posts_tags" ADD CONSTRAINT "FK_5b2cc57430f349c4bb4867f66ed" FOREIGN KEY ("tag_acl_id") REFERENCES "acl_tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "acl_posts_tags" DROP CONSTRAINT "FK_5b2cc57430f349c4bb4867f66ed"`);
        await queryRunner.query(`ALTER TABLE "acl_posts_tags" DROP CONSTRAINT "FK_bbf500a1b01d7109b7a0b2bdcc4"`);
        await queryRunner.query(`ALTER TABLE "acl_tags" DROP CONSTRAINT "FK_d1c608d057ce31dfea67a9a7049"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b2cc57430f349c4bb4867f66e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbf500a1b01d7109b7a0b2bdcc"`);
        await queryRunner.query(`DROP TABLE "acl_posts_tags"`);
        await queryRunner.query(`DROP TABLE "acl_tags"`);
    }

}
