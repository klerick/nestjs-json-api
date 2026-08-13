import { ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { Query } from '@klerick/json-api-nestjs';
import type { QueryOrderMap, EntityKey } from '@mikro-orm/core';

import { MicroOrmService } from '../../service';
import { asOrderBy } from '../../runtime-query';

export function getSortObject<E extends object, IdKey extends string>(
  query: Query<E, IdKey>
): QueryOrderMap<E> {
  const { sort } = query;
  const sortObject: Record<string, unknown> = {};
  if (!sort) return asOrderBy<E>(sortObject);

  const { target = {}, ...relation } = sort as any;
  for (const [filed, sortType] of ObjectTyped.entries(target)) {
    Reflect.set(sortObject, filed, sortType);
  }

  for (const [relationName, orderConfig = {}] of ObjectTyped.entries(
    relation
  )) {
    const name = String(relationName);
    const nested: Record<string, unknown> = {};
    for (const [field, sortType] of ObjectTyped.entries(orderConfig)) {
      nested[String(field)] = sortType;
    }
    sortObject[name] = nested;
  }
  return asOrderBy<E>(sortObject);
}

export function getQueryForCount<E extends object, IdKey extends string>(
  this: MicroOrmService<E, IdKey>,
  query: Query<E, IdKey>
) {
  const querySelect = this.microOrmUtilService.queryBuilder();
  const sortObject = getSortObject(query);
  querySelect.orderBy(
    Object.keys(sortObject).length > 0
      ? sortObject
      : asOrderBy<E>({
          [this.microOrmUtilService.currentPrimaryColumn]: 'ASC',
        })
  );

  const expressionArrayForTarget =
    this.microOrmUtilService.getFilterExpressionForTarget(query as any);
  const expressionArrayForRelation =
    this.microOrmUtilService.getFilterExpressionForRelation(query as any);

  const resultExpression = [
    ...expressionArrayForTarget,
    ...expressionArrayForRelation,
  ];
  for (const expression of resultExpression) {
    querySelect.andWhere(expression);
  }

  return querySelect;
}
