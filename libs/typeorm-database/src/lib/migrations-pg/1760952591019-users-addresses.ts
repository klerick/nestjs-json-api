import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersAddresses1760952591019 implements MigrationInterface {
    name = 'UsersAddresses1760952591019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "addresses_id" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_2f8d527df0d3acb8aa51945a968" UNIQUE ("addresses_id")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_2f8d527df0d3acb8aa51945a968" FOREIGN KEY ("addresses_id") REFERENCES "addresses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_2f8d527df0d3acb8aa51945a968"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_2f8d527df0d3acb8aa51945a968"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "addresses_id"`);
    }

}
