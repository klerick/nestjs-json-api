import { MikroORM } from '@mikro-orm/core';
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
import { PgliteDriver } from '@mikro-orm/pglite';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
// @ts-ignore
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';

export async function initMikroOrm(testDbName: string) {
  const pgLite = new PGlite({
    extensions: { uuid_ossp },
  });

  const orm = await MikroORM.init<PgliteDriver>({
    highlighter: new SqlHighlighter(),
    metadataProvider: ReflectMetadataProvider,
    driver: PgliteDriver,
    dbName: testDbName,
    driverOptions: {
      pglite: () => pgLite,
    },
    entities: [Users, UserGroups, Roles, Comments, Addresses, Notes],
    allowGlobalContext: true,
    schema: 'public',
    debug: false
      // process.env['DB_LOGGING'] !== '0' ? ['query', 'query-params'] : false,
  });

  const sql = await orm.schema.getCreateSchemaSQL();
  const statements = sql.split(';').filter((s) => s.trim().length > 0); // Разбиваем на отдельные команды
  for (const statement of statements) {
    await orm.em.execute(statement);
  }

  return orm;
}
