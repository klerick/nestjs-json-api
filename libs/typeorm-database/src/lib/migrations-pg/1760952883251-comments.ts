import { MigrationInterface, QueryRunner } from "typeorm";

export class Comments1760952883251 implements MigrationInterface {
    name = 'Comments1760952883251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."comments_kind_enum" AS ENUM('COMMENT', 'MESSAGE', 'NOTE')`);
        await queryRunner.query(`CREATE TABLE "comments" ("id" SERIAL NOT NULL, "text" text NOT NULL, "kind" "public"."comments_kind_enum" NOT NULL, "created_at" TIMESTAMP DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT false`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP TYPE "public"."comments_kind_enum"`);
    }

}
