import type { EntityName, QueryOrderMap } from '@mikro-orm/core';
import type { QBFilterQuery } from '@mikro-orm/sql';

/**
 * Boundary between JSON:API request data and MikroORM's typed query API.
 *
 * MikroORM 7 types the query builder in terms of literal unions derived from
 * the entity: `QBFilterQuery` is an intersection of a mapped type whose values
 * are unions, `EntityName` no longer accepts a plain string, and field paths
 * are `` `${alias}.${relation}` `` template literals. None of that can be
 * satisfied by values this adapter only learns at runtime -- filter keys, sort
 * fields, aliases and relation names all arrive as strings from the request.
 *
 * TypeScript cannot build such types through computed keys, so the shapes are
 * asserted here, at a single named boundary, instead of through casts scattered
 * over the call sites. Everything downstream stays fully typed.
 */

/** A filter object assembled from runtime keys. */
export function asFilter<T extends object>(
  condition: Record<string, unknown>
): QBFilterQuery<T, string> {
  return condition as QBFilterQuery<T, string>;
}

/** A sort map assembled from runtime field names. */
export function asOrderBy<T extends object>(
  order: Record<string, unknown>
): QueryOrderMap<T> {
  return order as QueryOrderMap<T>;
}

/** An entity referenced by the name metadata reports for it. */
export function byName<T extends object>(name: string): EntityName<T> {
  return name as unknown as EntityName<T>;
}

/**
 * An `alias.relation` field path. The return type is `never` so it satisfies
 * whichever literal union the call site expects.
 */
export function joinPath(alias: string, relation: string): never {
  return `${alias}.${relation}` as never;
}
