import * as process from 'node:process';
import { mkdirSync } from 'node:fs';
// @ts-ignore
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

import { types } from '@electric-sql/pglite';
import { PgliteDriver, defineConfig } from '@mikro-orm/pglite';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
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
const pgConfig = defineConfig({
  highlighter: new SqlHighlighter(),
  // v7 moved decorators into their own package and no longer wires up the
  // reflect-metadata provider implicitly; entities here use legacy decorators.
  metadataProvider: ReflectMetadataProvider,
  driver: PgliteDriver,
  // dbName carries the cluster location. Passing dataDir through driverOptions
  // instead would switch the adapter into named-database mode, where dbName
  // selects a database *inside* the cluster via CREATE DATABASE.
  dbName: pgDir,
  // The instance is built by the adapter rather than handed to it: a PGlite
  // instance the caller owns is deliberately left open on orm.close(), which
  // keeps the event loop alive and hangs the CLI. Everything here is forwarded
  // to PGlite.create().
  driverOptions: {
    extensions: { uuid_ossp },
    parsers: {
      [types.TIMESTAMP]: dateParser,
      [types.TIMESTAMPTZ]: dateParser,
      [types.DATE]: dateParser,
    },
  },
  entities: entitiesArray,
  debug: process.env['DB_LOGGING'] === '1',
});

export { pgConfig };
