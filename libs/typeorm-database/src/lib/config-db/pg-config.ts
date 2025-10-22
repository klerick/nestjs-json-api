import { PGliteDriver } from 'typeorm-pglite';
import * as process from 'node:process';
import { DataSourceOptions } from 'typeorm';
import { mkdirSync } from 'node:fs';
// @ts-ignore
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import * as allEntities from '../entities';

const pgDir = process.env['TEST'] ? './tmp/pg-test/typeorm' : './tmp/pg/typeorm'

mkdirSync(pgDir, { recursive: true });


const pgConfig: DataSourceOptions = {
  type: 'postgres',
  driver: new PGliteDriver({
    dataDir: pgDir,
    extensions: { uuid_ossp },
  }).driver,
  logging: process.env['DB_LOGGING'] === '1',
  entities: Object.values(allEntities) as any,
};

export { pgConfig };
