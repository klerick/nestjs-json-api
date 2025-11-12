import { MigrationInterface, QueryRunner } from "typeorm";

export class DocuemntAcl1762923848507 implements MigrationInterface {
    name = 'DocuemntAcl1762923848507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "acl_documents" ("id" SERIAL NOT NULL, "filename" character varying(255) NOT NULL, "mime_type" character varying(100) NOT NULL, "size" bigint NOT NULL, "path" character varying(500) NOT NULL, "shared_with" text NOT NULL DEFAULT '', "is_public" boolean NOT NULL DEFAULT false, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "owner_id" integer NOT NULL, CONSTRAINT "PK_87a342ec07408de4abbfe0926d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "acl_documents" ADD CONSTRAINT "FK_cf140746d213640ad4b3a2fe8cc" FOREIGN KEY ("owner_id") REFERENCES "acl_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "acl_documents" DROP CONSTRAINT "FK_cf140746d213640ad4b3a2fe8cc"`);
        await queryRunner.query(`DROP TABLE "acl_documents"`);
    }

}
