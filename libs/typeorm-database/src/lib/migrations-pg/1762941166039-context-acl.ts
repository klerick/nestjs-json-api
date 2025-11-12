import { MigrationInterface, QueryRunner } from "typeorm";

export class ContextAcl1762941166039 implements MigrationInterface {
    name = 'ContextAcl1762941166039'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "acl_context_test" ("id" SERIAL NOT NULL, "aclRules" json NOT NULL DEFAULT '{}', "context" json NOT NULL DEFAULT '{}', CONSTRAINT "PK_12da682d534824e0fcbbd1cb585" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "acl_context_test"`);
    }

}
