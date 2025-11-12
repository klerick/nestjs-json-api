import { Options } from '@mikro-orm/core';
import { TSMigrationGenerator } from '@mikro-orm/migrations';
import { join } from 'node:path';
import { pgConfig } from './config-pg';
import { PGlite } from '@electric-sql/pglite';

const config: Options = {
  ...pgConfig,
  migrations: {
    tableName: 'migrations',
    path: join(__dirname, '/migrations'),
    glob: '!(*.d).{js,ts}',
    transactional: false,
    allOrNothing: true,
    dropTables: true,
    snapshot: true,
    emit: 'ts',
    generator: TSMigrationGenerator,
  },
  seeder: {
    path: join(__dirname, './seeders'),
  }
};

export default Promise.resolve(config).then(async (configR) => {

  // @ts-ignore
  const {driverOptions: {connection: {pglite: pgLiteCall}}} = configR;
  const pgLite: PGlite = pgLiteCall();
  await pgLite.waitReady

  // not parser array
  // pgLite.parsers[1003] = (...arg: any[]) => arg[0]


  return config
});
