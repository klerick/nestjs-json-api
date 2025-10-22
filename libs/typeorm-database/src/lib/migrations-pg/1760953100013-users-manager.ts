import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersManager1760953100013 implements MigrationInterface {
    name = 'UsersManager1760953100013'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "manager_id" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fba2d8e029689aa8fea98e53c91" UNIQUE ("manager_id")`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT 'false'`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_fba2d8e029689aa8fea98e53c91" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_fba2d8e029689aa8fea98e53c91"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_fba2d8e029689aa8fea98e53c91"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "manager_id"`);
    }

}
