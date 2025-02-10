import { Knex as TypeKnex } from '@mikro-orm/knex';
import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

import Knex from 'knex';
import * as ClientPgLite from 'knex-pglite';

import {
  Addresses,
  Comments,
  Notes,
  Roles,
  UserGroups,
  Users,
} from '../entities';

let knexInst: TypeKnex;

export async function sharedConnect(): Promise<TypeKnex> {
  // @ts-ignore
  // return globalThis.pgLite;

  if (knexInst) {
    return knexInst;
  }

  const pgLite = await Promise.all([
    import('@electric-sql/pglite'),
    // @ts-ignore
    import('@electric-sql/pglite/contrib/uuid_ossp'),
  ]).then(
    ([{ PGlite }, { uuid_ossp }]) =>
      new PGlite({
        extensions: { uuid_ossp },
      })
  );

  knexInst = Knex({
    // @ts-ignore
    client: ClientPgLite,
    dialect: 'postgres',
    // @ts-ignore
    connection: { pglite: pgLite },
  });

  return knexInst;
}

export async function initMikroOrm(knex: TypeKnex, testDbName: string) {
  const result = await knex.raw(
    `select 1 from pg_database where datname = '${testDbName}'`
  );

  if ((result['rows'] as []).length === 0) {
    await knex.raw(`create database ??`, [testDbName]);
  }

  const orm = await MikroORM.init<PostgreSqlDriver>({
    highlighter: new SqlHighlighter(),
    driver: PostgreSqlDriver,
    dbName: testDbName,
    driverOptions: knexInst,
    entities: [Users, UserGroups, Roles, Comments, Addresses, Notes],
    allowGlobalContext: true,
    schema: 'public',
    debug: ['query', 'query-params'],
  });

  if ((result['rows'] as []).length === 0) {
    const sql = await orm.getSchemaGenerator().getCreateSchemaSQL();
    const statements = sql.split(';').filter((s) => s.trim().length > 0); // Разбиваем на отдельные команды

    for (const statement of statements) {
      await orm.em.execute(statement);
    }
  }

  return orm;
}
