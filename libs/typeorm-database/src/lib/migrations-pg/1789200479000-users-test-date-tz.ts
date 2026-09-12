import { MigrationInterface, QueryRunner } from 'typeorm';

export class UsersTestDateTz1789200479000 implements MigrationInterface {
  name = 'UsersTestDateTz1789200479000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "test_date_tz" TIMESTAMP WITH TIME ZONE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "test_date_tz"`);
  }
}
