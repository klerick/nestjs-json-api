import { ObjectTyped, ResourceObject } from '@klerick/json-api-nestjs-shared';

import { MicroOrmService } from '../../service';
import { Query } from '../../../mixin/zod';
import { ObjectLiteral } from '../../../../types';
import type { QBQueryOrderMap, EntityKey } from '@mikro-orm/core';

export function getSortObject<E extends ObjectLiteral>(
  query: Query<E>
): QBQueryOrderMap<E> {
  const { sort } = query;
  const sortObject: QBQueryOrderMap<E> = {};
  if (!sort) return sortObject;

  const { target = {}, ...relation } = sort;
  for (const [filed, sortType] of ObjectTyped.entries(target)) {
    sortObject[filed] = sortType;
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

export function getQueryForCount<E extends ObjectLiteral>(
  this: MicroOrmService<E>,
  query: Query<E>
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
    this.microOrmUtilService.getFilterExpressionForTarget(query);
  const expressionArrayForRelation =
    this.microOrmUtilService.getFilterExpressionForRelation(query);

  const resultExpression = [
    ...expressionArrayForTarget,
    ...expressionArrayForRelation,
  ];
  for (const expression of resultExpression) {
    querySelect.andWhere(expression);
  }

  return querySelect;
}
