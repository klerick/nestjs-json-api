import { MigrationInterface, QueryRunner } from "typeorm";

export class BookListUuid1760959428979 implements MigrationInterface {
    name = 'BookListUuid1760959428979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT 'false'`);
        await queryRunner.query(`ALTER TABLE "users_have_book" DROP CONSTRAINT "FK_88eb6d4c67dab296d402b0ae2e2"`);
        await queryRunner.query(`ALTER TABLE "book_list" DROP CONSTRAINT "PK_8cf4bf655b0ec86d610e471641d"`);
        await queryRunner.query(`ALTER TABLE "book_list" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "book_list" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "book_list" ADD CONSTRAINT "PK_8cf4bf655b0ec86d610e471641d" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "users_have_book" DROP CONSTRAINT "PK_38e99ac4899701872062fa4c5cb"`);
        await queryRunner.query(`ALTER TABLE "users_have_book" ADD CONSTRAINT "PK_7b85c8711c8d45d686a1b6ea64e" PRIMARY KEY ("users_id")`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88eb6d4c67dab296d402b0ae2e"`);
        await queryRunner.query(`ALTER TABLE "users_have_book" DROP COLUMN "book_list_id"`);
        await queryRunner.query(`ALTER TABLE "users_have_book" ADD "book_list_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users_have_book" DROP CONSTRAINT "PK_7b85c8711c8d45d686a1b6ea64e"`);
        await queryRunner.query(`ALTER TABLE "users_have_book" ADD CONSTRAINT "PK_38e99ac4899701872062fa4c5cb" PRIMARY KEY ("users_id", "book_list_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_88eb6d4c67dab296d402b0ae2e" ON "users_have_book" ("book_list_id") `);
        await queryRunner.query(`ALTER TABLE "users_have_book" ADD CONSTRAINT "FK_88eb6d4c67dab296d402b0ae2e2" FOREIGN KEY ("book_list_id") REFERENCES "book_list"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_have_book" DROP CONSTRAINT "FK_88eb6d4c67dab296d402b0ae2e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88eb6d4c67dab296d402b0ae2e"`);
        await queryRunner.query(`ALTER TABLE "users_have_book" DROP CONSTRAINT "PK_38e99ac4899701872062fa4c5cb"`);
        await queryRunner.query(`ALTER TABLE "users_have_book" ADD CONSTRAINT "PK_7b85c8711c8d45d686a1b6ea64e" PRIMARY KEY ("users_id")`);
        await queryRunner.query(`ALTER TABLE "users_have_book" DROP COLUMN "book_list_id"`);
        await queryRunner.query(`ALTER TABLE "users_have_book" ADD "book_list_id" integer NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_88eb6d4c67dab296d402b0ae2e" ON "users_have_book" ("book_list_id") `);
        await queryRunner.query(`ALTER TABLE "users_have_book" DROP CONSTRAINT "PK_7b85c8711c8d45d686a1b6ea64e"`);
        await queryRunner.query(`ALTER TABLE "users_have_book" ADD CONSTRAINT "PK_38e99ac4899701872062fa4c5cb" PRIMARY KEY ("book_list_id", "users_id")`);
        await queryRunner.query(`ALTER TABLE "book_list" DROP CONSTRAINT "PK_8cf4bf655b0ec86d610e471641d"`);
        await queryRunner.query(`ALTER TABLE "book_list" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "book_list" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "book_list" ADD CONSTRAINT "PK_8cf4bf655b0ec86d610e471641d" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "users_have_book" ADD CONSTRAINT "FK_88eb6d4c67dab296d402b0ae2e2" FOREIGN KEY ("book_list_id") REFERENCES "book_list"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT false`);
    }

}
