import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersComments1760952932505 implements MigrationInterface {
    name = 'UsersComments1760952932505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" ADD "created_by" integer`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT 'false'`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_980bfefe00ed11685f325d0bd4c" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_980bfefe00ed11685f325d0bd4c"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "is_default" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "created_by"`);
    }

}
