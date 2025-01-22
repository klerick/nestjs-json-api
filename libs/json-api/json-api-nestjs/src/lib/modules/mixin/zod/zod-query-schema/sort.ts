import { ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { z } from 'zod';

import { RelationTree, ResultGetField } from '../../types';
import { ObjectLiteral } from '../../../../types';
import { SORT_TYPE } from '../../../../constants';
import { nonEmptyObject } from '../zod-utils';

function getZodSortRule() {
  return z.enum(SORT_TYPE).optional();
}

function getZodFieldRule<F extends readonly [string, ...string[]]>(fields: F) {
  const targetShape = fields.reduce(
    (acum, item) => ({
      ...acum,
      [item]: getZodSortRule(),
    }),
    {} as { [K in F[number]]: ZodSortRule }
  );

  return z.object(targetShape).strict().refine(nonEmptyObject()).optional();
}

type ZodSortRule = ReturnType<typeof getZodSortRule>;
type ZodFieldRule<F extends readonly [string, ...string[]]> = ReturnType<
  typeof getZodFieldRule<F>
>;

export function zodSortQuery<E extends ObjectLiteral>(
  fields: ResultGetField<E>['field'],
  relationList: RelationTree<E>
) {
  const zodRelationShape = {} as {
    [K in keyof RelationTree<E>]: ZodFieldRule<RelationTree<E>[K]>;
  };
  const zodTargetShape: { target: ZodFieldRule<ResultGetField<E>['field']> } = {
    target: getZodFieldRule(fields),
  };

  for (const [key, val] of ObjectTyped.entries(relationList)) {
    if (key === 'target') continue;
    zodRelationShape[key] = getZodFieldRule(val);
  }

  return z
    .object({
      ...zodTargetShape,
      ...zodRelationShape,
    })
    .strict()
    .partial()
    .refine(nonEmptyObject())
    .nullable();
}

export type ZodSortQuery<E extends ObjectLiteral> = ReturnType<
  typeof zodSortQuery<E>
>;
export type SortQuery<E extends ObjectLiteral> = z.infer<ZodSortQuery<E>>;
