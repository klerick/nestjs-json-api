import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

import {
  Addresses,
  Comments,
  Notes,
  Roles,
  UserGroups,
  Users,
} from '../entities';
import { PGlite } from '@electric-sql/pglite';
// @ts-ignore
import { PGliteDriver, PGliteConnectionConfig } from 'mikro-orm-pglite';
// @ts-ignore
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';

export async function initMikroOrm(testDbName: string) {
  const pgLite = new PGlite({
    extensions: { uuid_ossp },
  });

  const orm = await MikroORM.init<PostgreSqlDriver>({
    highlighter: new SqlHighlighter(),
    // PGliteDriver is a drop-in for PostgreSqlDriver at runtime, but
    // mikro-orm-pglite is built against @mikro-orm/postgresql ^6.5.6 while this
    // workspace overrides it to 6.4.x, so their driver types no longer line up.
    // moduleResolution: bundler made those types visible for the first time.
    driver: PGliteDriver as unknown as typeof PostgreSqlDriver,
    dbName: testDbName,
    driverOptions: {
      connection: {
        pglite: () => pgLite,
      } satisfies PGliteConnectionConfig,
    },
    entities: [Users, UserGroups, Roles, Comments, Addresses, Notes],
    allowGlobalContext: true,
    schema: 'public',
    debug: false
      // process.env['DB_LOGGING'] !== '0' ? ['query', 'query-params'] : false,
  });

  const sql = await orm.getSchemaGenerator().getCreateSchemaSQL();
  const statements = sql.split(';').filter((s) => s.trim().length > 0); // Разбиваем на отдельные команды
  for (const statement of statements) {
    await orm.em.execute(statement);
  }

  return orm;
}
