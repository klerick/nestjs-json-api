import { Options as PgOptions, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Options as MyOptions, MySqlDriver } from '@mikro-orm/mysql';
import { TSMigrationGenerator } from '@mikro-orm/migrations';
import { Options } from '@mikro-orm/core';
import { join } from 'path';

import * as allEntities from './entities';

const entitiesArray = Object.values(allEntities).filter(
  (maybeClass) => typeof maybeClass === 'function'
);

const mySqlOptions: MyOptions = {
  driver: MySqlDriver,
};

const pgSqlOptions: PgOptions = {
  driver: PostgreSqlDriver,
};

const config: Options = {
  // dbName: process.env['DB_NAME'],
  dbName: 'microorm-test',
  host: process.env['DB_HOST'],
  port: parseInt(`${process.env['DB_PORT']}`, 10),
  user: process.env['DB_USERNAME'],
  password: process.env['DB_PASSWORD'],
  entitiesTs: [join(__dirname, '/entities/**/*')],
  entities: entitiesArray,
  debug: process.env['DB_LOGGING'] === '1',
  ...(process.env['DB_TYPE'] === 'mysql' ? mySqlOptions : pgSqlOptions),
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
