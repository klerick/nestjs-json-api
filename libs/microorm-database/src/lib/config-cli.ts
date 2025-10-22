import { Options } from '@mikro-orm/core';
import { TSMigrationGenerator } from '@mikro-orm/migrations';
import { join } from 'node:path';
import { pgConfig } from './config-pg';

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
};

export default config;
