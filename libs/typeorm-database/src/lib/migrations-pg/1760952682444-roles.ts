import { MigrationInterface, QueryRunner } from "typeorm";

export class Roles1760952682444 implements MigrationInterface {
    name = 'Roles1760952682444'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying(128) DEFAULT 'NULL', "key" character varying(128) NOT NULL, "is_default" boolean NOT NULL DEFAULT 'false', "created_at" TIMESTAMP DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_a87cf0659c3ac379b339acf36a2" UNIQUE ("key"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "roles"`);
    }

}
