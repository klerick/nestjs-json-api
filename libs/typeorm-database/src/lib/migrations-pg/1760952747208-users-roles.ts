import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersRoles1760952747208 implements MigrationInterface {
    name = 'UsersRoles1760952747208'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users_have_roles" ("users_id" integer NOT NULL, "roles_id" integer NOT NULL, CONSTRAINT "PK_45abc98688f8c198420048741b8" PRIMARY KEY ("users_id", "roles_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bb66594b23503c32a315a63fe1" ON "users_have_roles" ("users_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_afa6ce5ffd14d2e5580fd54624" ON "users_have_roles" ("roles_id") `);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT 'false'`);
        await queryRunner.query(`ALTER TABLE "users_have_roles" ADD CONSTRAINT "FK_bb66594b23503c32a315a63fe1e" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "users_have_roles" ADD CONSTRAINT "FK_afa6ce5ffd14d2e5580fd54624e" FOREIGN KEY ("roles_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_have_roles" DROP CONSTRAINT "FK_afa6ce5ffd14d2e5580fd54624e"`);
        await queryRunner.query(`ALTER TABLE "users_have_roles" DROP CONSTRAINT "FK_bb66594b23503c32a315a63fe1e"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT false`);
        await queryRunner.query(`DROP INDEX "public"."IDX_afa6ce5ffd14d2e5580fd54624"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb66594b23503c32a315a63fe1"`);
        await queryRunner.query(`DROP TABLE "users_have_roles"`);
    }

}
