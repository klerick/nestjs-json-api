import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserAcl1762922721853 implements MigrationInterface {
    name = 'CreateUserAcl1762922721853'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "acl_users" ("id" SERIAL NOT NULL, "login" character varying(100) NOT NULL, "first_name" character varying(100) DEFAULT 'NULL', "last_name" character varying(100) DEFAULT 'NULL', "is_active" boolean DEFAULT false, "created_at" TIMESTAMP DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "UQ_c8fcd14d1f189ce9b442f8334af" UNIQUE ("login"), CONSTRAINT "PK_2e01ce6e61175f84520187152ca" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "acl_users"`);
    }

}
