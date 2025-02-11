import { ObjectTyped } from '../../../../utils/nestjs-shared';
import { z } from 'zod';

import { nonEmptyObject, uniqueArray } from '../zod-utils';
import { ObjectLiteral } from '../../../../types';
import { ResultGetField, RelationTree } from '../../types';

function getZodRules<K extends readonly [string, ...string[]]>(fields: K) {
  return z
    .enum(fields)
    .array()
    .nonempty()
    .refine(uniqueArray(), {
      message: 'Field should be unique',
    })
    .optional();
}

type ZodRule<K extends readonly [string, ...string[]]> = ReturnType<
  typeof getZodRules<K>
>;

export function zodFieldsQuery<E extends ObjectLiteral>(
  fields: ResultGetField<E>['field'],
  relationList: RelationTree<E>
) {
  const target = {
    target: getZodRules(fields),
  };

  const relation = {} as {
    [K in keyof RelationTree<E>]: ZodRule<RelationTree<E>[K]>;
  };

  for (const [key, value] of ObjectTyped.entries(relationList)) {
    relation[key] = getZodRules(value);
  }

  return z
    .object({
      ...target,
      ...relation,
    })
    .strict('Should be only target of relation')
    .refine(nonEmptyObject(), {
      message: 'Validation error: Select target or relation fields',
    })
    .nullable();
}
export type ZodFieldsQuery<E extends ObjectLiteral> = ReturnType<
  typeof zodFieldsQuery<E>
>;
export type FieldsQuery<E extends ObjectLiteral> = z.infer<ZodFieldsQuery<E>>;
