import { MigrationInterface, QueryRunner } from "typeorm";

export class Users1760952504762 implements MigrationInterface {
    name = 'Users1760952504762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "login" character varying(100) NOT NULL, "first_name" character varying(100) DEFAULT 'NULL', "last_name" character varying(100) DEFAULT 'NULL', "is_active" boolean DEFAULT false, "created_at" TIMESTAMP DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c" UNIQUE ("login"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
