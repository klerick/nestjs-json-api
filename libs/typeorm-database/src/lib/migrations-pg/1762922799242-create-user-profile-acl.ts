import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserProfileAcl1762922799242 implements MigrationInterface {
    name = 'CreateUserProfileAcl1762922799242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."acl_user_profiles_role_enum" AS ENUM('admin', 'user', 'moderator')`);
        await queryRunner.query(`CREATE TABLE "acl_user_profiles" ("id" SERIAL NOT NULL, "first_name" character varying(100), "last_name" character varying(100), "bio" text, "avatar" character varying(255), "phone" character varying(200), "salary" numeric(10,2), "is_public" boolean NOT NULL DEFAULT true, "role" "public"."acl_user_profiles_role_enum" NOT NULL DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "REL_78b082233fc8ab9308a77739d3" UNIQUE ("user_id"), CONSTRAINT "PK_b8deca153edfaa849436166c261" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "acl_user_profiles" ADD CONSTRAINT "FK_78b082233fc8ab9308a77739d31" FOREIGN KEY ("user_id") REFERENCES "acl_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "acl_user_profiles" DROP CONSTRAINT "FK_78b082233fc8ab9308a77739d31"`);
        await queryRunner.query(`DROP TABLE "acl_user_profiles"`);
        await queryRunner.query(`DROP TYPE "public"."acl_user_profiles_role_enum"`);
    }

}
