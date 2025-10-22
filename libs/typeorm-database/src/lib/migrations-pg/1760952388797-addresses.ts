import { MigrationInterface, QueryRunner } from "typeorm";

export class Addresses1760952388797 implements MigrationInterface {
    name = 'Addresses1760952388797'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "addresses" ("id" SERIAL NOT NULL, "city" character varying(70) DEFAULT 'NULL', "state" character varying(70) DEFAULT 'NULL', "country" character varying(68) DEFAULT 'NULL', "created_at" TIMESTAMP DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "addresses"`);
    }

}
