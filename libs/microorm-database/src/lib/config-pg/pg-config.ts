import * as process from 'node:process';
import { mkdirSync } from 'node:fs';
// @ts-ignore
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { Options } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

import { PGlite, types } from '@electric-sql/pglite';
import { PGliteDriver, PGliteConnectionConfig } from "mikro-orm-pglite";
import * as allEntities from '../entities';

// Patch for PGlite timezone issue: https://github.com/electric-sql/pglite/issues/532
function parseDateAsUtc(value: string): Date {
  const hasTimezone = value.endsWith('Z') || /[+-]\d{2}(:\d{2})?$/.test(value);
  if (hasTimezone) {
    return new Date(value.replace(' ', 'T'));
  }

  const isDateOnly = !value.includes(' ') && !value.includes('T');
  if (isDateOnly) {
    return new Date(value + 'T00:00:00Z');
  }

  return new Date(value.replace(' ', 'T') + 'Z');
}

const dateParser = (value: string) => {
  return parseDateAsUtc(value);
};

const pgDir = process.env['TEST'] ? './tmp/pg-test/microorm' : './tmp/pg/microorm'

mkdirSync(pgDir, { recursive: true });

const entitiesArray = Object.values(allEntities).filter(
  (maybeClass) => typeof maybeClass === 'function'
);
const testDbName = 'mikroorm-database'
const pgLite = new PGlite({
  extensions: { uuid_ossp },
  dataDir: pgDir,
  parsers: {
    [types.TIMESTAMP]: dateParser,
    [types.TIMESTAMPTZ]: dateParser,
    [types.DATE]: dateParser,
  },
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
