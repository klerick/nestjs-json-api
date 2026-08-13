import { defineConfig } from '@mikro-orm/pglite';
import { TSMigrationGenerator } from '@mikro-orm/migrations';
import { join } from 'node:path';
import { pgConfig } from './config-pg';

const config = defineConfig({
  ...pgConfig,
  migrations: {
    tableName: 'migrations',
    path: join(__dirname, '/migrations'),
    glob: '!(*.d).{js,ts}',
    transactional: false,
    allOrNothing: true,
    dropTables: true,
    snapshot: true,
    // Pinned because the default is derived from dbName, which now carries the
    // PGlite cluster path rather than a symbolic database name.
    snapshotName: '.snapshot-mikroorm-database',
    emit: 'ts',
    generator: TSMigrationGenerator,
  },
  seeder: {
    path: join(__dirname, './seeders'),
  },
});

export default config;
