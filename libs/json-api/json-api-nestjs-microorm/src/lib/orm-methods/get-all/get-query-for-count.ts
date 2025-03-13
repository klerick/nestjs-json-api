import { ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { Query } from '@klerick/json-api-nestjs';
import type { QBQueryOrderMap, EntityKey } from '@mikro-orm/core';

import { MicroOrmService } from '../../service';

export function getSortObject<E extends object, IdKey extends string>(
  query: Query<E, IdKey>
): QBQueryOrderMap<E> {
  const { sort } = query;
  const sortObject: QBQueryOrderMap<E> = {};
  if (!sort) return sortObject;

  const { target = {}, ...relation } = sort as any;
  for (const [filed, sortType] of ObjectTyped.entries(target)) {
    Reflect.set(sortObject, filed, sortType);
  }

  for (const [relationName, orderConfig = {}] of ObjectTyped.entries(
    relation
  )) {
    const name = relationName as unknown as EntityKey<E>;
    sortObject[name] = {};
    for (const [field, sortType] of ObjectTyped.entries(orderConfig)) {
      sortObject[name][field] = sortType;
    }
  }
  return sortObject;
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
      : {
          [this.microOrmUtilService.currentPrimaryColumn]: 'ASC',
        }
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
