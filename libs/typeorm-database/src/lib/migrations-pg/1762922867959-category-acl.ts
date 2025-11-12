import { MigrationInterface, QueryRunner } from "typeorm";

export class CategoryAcl1762922867959 implements MigrationInterface {
    name = 'CategoryAcl1762922867959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "acl_categories" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "slug" character varying(150) NOT NULL, "level" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "parent_id" integer, CONSTRAINT "UQ_003552626673e2b1b35fee30344" UNIQUE ("slug"), CONSTRAINT "PK_a05e0032ca25208457dd595f4f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "acl_categories" ADD CONSTRAINT "FK_e6d3276c516d6b930ed19e87b58" FOREIGN KEY ("parent_id") REFERENCES "acl_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "acl_categories" DROP CONSTRAINT "FK_e6d3276c516d6b930ed19e87b58"`);
        await queryRunner.query(`DROP TABLE "acl_categories"`);
    }

}
