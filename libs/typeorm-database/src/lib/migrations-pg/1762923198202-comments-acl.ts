import { MigrationInterface, QueryRunner } from "typeorm";

export class CommentsAcl1762923198202 implements MigrationInterface {
    name = 'CommentsAcl1762923198202'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "acl_comments" ("id" SERIAL NOT NULL, "content" text NOT NULL, "is_approved" boolean NOT NULL DEFAULT false, "is_edited" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "post_id" integer NOT NULL, "author_id" integer NOT NULL, CONSTRAINT "PK_ca277117c8248a61e4cc368f3e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "acl_comments" ADD CONSTRAINT "FK_61e92badc2df53e8b09f2db7a6b" FOREIGN KEY ("post_id") REFERENCES "acl_posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "acl_comments" ADD CONSTRAINT "FK_9e8669c52a560b44eb92d00e8b6" FOREIGN KEY ("author_id") REFERENCES "acl_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "acl_comments" DROP CONSTRAINT "FK_9e8669c52a560b44eb92d00e8b6"`);
        await queryRunner.query(`ALTER TABLE "acl_comments" DROP CONSTRAINT "FK_61e92badc2df53e8b09f2db7a6b"`);
        await queryRunner.query(`DROP TABLE "acl_comments"`);
    }

}
