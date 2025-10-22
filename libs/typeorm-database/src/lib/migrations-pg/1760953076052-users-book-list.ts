import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersBookList1760953076052 implements MigrationInterface {
    name = 'UsersBookList1760953076052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users_have_book" ("users_id" integer NOT NULL, "book_list_id" integer NOT NULL, CONSTRAINT "PK_38e99ac4899701872062fa4c5cb" PRIMARY KEY ("users_id", "book_list_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7b85c8711c8d45d686a1b6ea64" ON "users_have_book" ("users_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_88eb6d4c67dab296d402b0ae2e" ON "users_have_book" ("book_list_id") `);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT 'false'`);
        await queryRunner.query(`ALTER TABLE "users_have_book" ADD CONSTRAINT "FK_7b85c8711c8d45d686a1b6ea64e" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "users_have_book" ADD CONSTRAINT "FK_88eb6d4c67dab296d402b0ae2e2" FOREIGN KEY ("book_list_id") REFERENCES "book_list"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_have_book" DROP CONSTRAINT "FK_88eb6d4c67dab296d402b0ae2e2"`);
        await queryRunner.query(`ALTER TABLE "users_have_book" DROP CONSTRAINT "FK_7b85c8711c8d45d686a1b6ea64e"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT false`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88eb6d4c67dab296d402b0ae2e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7b85c8711c8d45d686a1b6ea64"`);
        await queryRunner.query(`DROP TABLE "users_have_book"`);
    }

}
