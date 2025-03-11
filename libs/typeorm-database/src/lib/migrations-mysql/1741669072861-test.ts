import { MigrationInterface, QueryRunner } from 'typeorm';

export class Test1741669072861 implements MigrationInterface {
  name = 'Test1741669072861';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`addresses\` (\`id\` int NOT NULL AUTO_INCREMENT, \`city\` varchar(70) NULL DEFAULT 'NULL', \`state\` varchar(70) NULL DEFAULT 'NULL', \`country\` varchar(68) NULL DEFAULT 'NULL', \`created_at\` timestamp NULL, \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(128) NULL DEFAULT 'NULL', \`key\` varchar(128) NOT NULL, \`is_default\` tinyint NOT NULL DEFAULT 0, \`created_at\` timestamp NULL, \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a87cf0659c3ac379b339acf36a\` (\`key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`comments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`text\` text NOT NULL, \`kind\` enum ('COMMENT', 'MESSAGE', 'NOTE') NOT NULL, \`created_at\` timestamp NULL, \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_by\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`book_list\` (\`id\` int NOT NULL AUTO_INCREMENT, \`text\` text NOT NULL, \`created_at\` timestamp NULL, \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`login\` varchar(100) NOT NULL, \`first_name\` varchar(100) NULL DEFAULT 'NULL', \`last_name\` varchar(100) NULL DEFAULT 'NULL', \`is_active\` tinyint NOT NULL DEFAULT 0, \`created_at\` timestamp NULL, \`updated_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`addresses_id\` int NULL, \`manager_id\` int NULL, UNIQUE INDEX \`IDX_2d443082eccd5198f95f2a36e2\` (\`login\`), UNIQUE INDEX \`REL_2f8d527df0d3acb8aa51945a96\` (\`addresses_id\`), UNIQUE INDEX \`REL_fba2d8e029689aa8fea98e53c9\` (\`manager_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`users_have_roles\` (\`users_id\` int NOT NULL, \`roles_id\` int NOT NULL, INDEX \`IDX_bb66594b23503c32a315a63fe1\` (\`users_id\`), INDEX \`IDX_afa6ce5ffd14d2e5580fd54624\` (\`roles_id\`), PRIMARY KEY (\`users_id\`, \`roles_id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`users_have_book\` (\`users_id\` int NOT NULL, \`book_list_id\` int NOT NULL, INDEX \`IDX_7b85c8711c8d45d686a1b6ea64\` (\`users_id\`), INDEX \`IDX_88eb6d4c67dab296d402b0ae2e\` (\`book_list_id\`), PRIMARY KEY (\`users_id\`, \`book_list_id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_980bfefe00ed11685f325d0bd4c\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_2f8d527df0d3acb8aa51945a968\` FOREIGN KEY (\`addresses_id\`) REFERENCES \`addresses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_fba2d8e029689aa8fea98e53c91\` FOREIGN KEY (\`manager_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`users_have_roles\` ADD CONSTRAINT \`FK_bb66594b23503c32a315a63fe1e\` FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE \`users_have_roles\` ADD CONSTRAINT \`FK_afa6ce5ffd14d2e5580fd54624e\` FOREIGN KEY (\`roles_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`users_have_book\` ADD CONSTRAINT \`FK_7b85c8711c8d45d686a1b6ea64e\` FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE \`users_have_book\` ADD CONSTRAINT \`FK_88eb6d4c67dab296d402b0ae2e2\` FOREIGN KEY (\`book_list_id\`) REFERENCES \`book_list\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users_have_book\` DROP FOREIGN KEY \`FK_88eb6d4c67dab296d402b0ae2e2\``
    );
    await queryRunner.query(
      `ALTER TABLE \`users_have_book\` DROP FOREIGN KEY \`FK_7b85c8711c8d45d686a1b6ea64e\``
    );
    await queryRunner.query(
      `ALTER TABLE \`users_have_roles\` DROP FOREIGN KEY \`FK_afa6ce5ffd14d2e5580fd54624e\``
    );
    await queryRunner.query(
      `ALTER TABLE \`users_have_roles\` DROP FOREIGN KEY \`FK_bb66594b23503c32a315a63fe1e\``
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_fba2d8e029689aa8fea98e53c91\``
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_2f8d527df0d3acb8aa51945a968\``
    );
    await queryRunner.query(
      `ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_980bfefe00ed11685f325d0bd4c\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_88eb6d4c67dab296d402b0ae2e\` ON \`users_have_book\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_7b85c8711c8d45d686a1b6ea64\` ON \`users_have_book\``
    );
    await queryRunner.query(`DROP TABLE \`users_have_book\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_afa6ce5ffd14d2e5580fd54624\` ON \`users_have_roles\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_bb66594b23503c32a315a63fe1\` ON \`users_have_roles\``
    );
    await queryRunner.query(`DROP TABLE \`users_have_roles\``);
    await queryRunner.query(
      `DROP INDEX \`REL_fba2d8e029689aa8fea98e53c9\` ON \`users\``
    );
    await queryRunner.query(
      `DROP INDEX \`REL_2f8d527df0d3acb8aa51945a96\` ON \`users\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_2d443082eccd5198f95f2a36e2\` ON \`users\``
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP TABLE \`book_list\``);
    await queryRunner.query(`DROP TABLE \`comments\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a87cf0659c3ac379b339acf36a\` ON \`roles\``
    );
    await queryRunner.query(`DROP TABLE \`roles\``);
    await queryRunner.query(`DROP TABLE \`addresses\``);
  }
}
