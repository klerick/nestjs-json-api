import * as process from 'node:process';
import { mkdirSync } from 'node:fs';
// @ts-ignore
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { Options } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

import { PGlite } from '@electric-sql/pglite';
import { PGliteDriver, PGliteConnectionConfig } from "mikro-orm-pglite";
import * as allEntities from '../entities';

const pgDir = process.env['TEST'] ? './tmp/pg-test/microorm' : './tmp/pg/microorm'

mkdirSync(pgDir, { recursive: true });

const entitiesArray = Object.values(allEntities).filter(
  (maybeClass) => typeof maybeClass === 'function'
);
const testDbName = 'mikroorm-database'
const pgLite = new PGlite({
  extensions: { uuid_ossp },
  dataDir: pgDir
})


const pgConfig: Options = {
  highlighter: new SqlHighlighter(),
  driver: PGliteDriver,
  dbName: testDbName,
  driverOptions: {
    connection: {
      pglite: () => pgLite,
    } satisfies PGliteConnectionConfig,
  },
  entities: entitiesArray,
  debug: process.env['DB_LOGGING'] === '1'
};

export { pgConfig };
