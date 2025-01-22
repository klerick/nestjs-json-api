import { z } from 'zod';
import { ObjectLiteral } from '../../../../types';
import { ResultGetField } from '../../types';
import { uniqueArray } from '../zod-utils';

export function zodIncludeQuery<E extends ObjectLiteral>(
  relationList: ResultGetField<E>['relations']
) {
  return z
    .enum(relationList)
    .array()
    .nonempty()
    .refine(uniqueArray(), {
      message: 'Include should have unique relation',
    })
    .nullable();
}

export type ZodIncludeQuery<E extends ObjectLiteral> = ReturnType<
  typeof zodIncludeQuery<E>
>;
export type IncludeQuery<E extends ObjectLiteral> = z.infer<ZodIncludeQuery<E>>;
