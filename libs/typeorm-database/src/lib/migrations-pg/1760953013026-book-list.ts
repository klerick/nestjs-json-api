import { MigrationInterface, QueryRunner } from "typeorm";

export class BookList1760953013026 implements MigrationInterface {
    name = 'BookList1760953013026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "book_list" ("id" SERIAL NOT NULL, "text" text NOT NULL, "created_at" TIMESTAMP DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_8cf4bf655b0ec86d610e471641d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT 'false'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT false`);
        await queryRunner.query(`DROP TABLE "book_list"`);
    }

}
