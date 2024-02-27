import { Entity } from '../../../types';
import { z, ZodEffects, ZodEnum, ZodObject, ZodOptional } from 'zod';
import { RelationTree, ResultGetField } from '../../orm';
import { SORT_TYPE } from '../../../constants';
import { nonEmptyObject } from '../zod-utils';

import { ObjectTyped } from '../../utils';

export type SortTarget<F extends readonly [string, ...string[]]> = {
  target: SortEntityOptionalObject<F>;
};

export const sortTarget = <R extends readonly [string, ...string[]]>(
  fields: R
): SortTarget<R> => ({
  target: z.object(sortEntity(fields)).strict().refine(nonEmptyObject()),
});

export const sortEntity = <R extends readonly [string, ...string[]]>(
  fields: R
): SortEntityOptional<R> =>
  fields.reduce(
    (acum, item) => ({
      ...acum,
      ...{
        [item]: z.enum(SORT_TYPE).optional(),
      },
    }),
    {} as SortEntityOptional<R>
  );

export type SortEnum = ZodEnum<['DESC', 'ASC']>;

export type SortEntityOptional<F extends readonly [string, ...string[]]> = {
  [K in F[number]]: ZodOptional<SortEnum>;
};

export type SortEntityOptionalObject<F extends readonly [string, ...string[]]> =
  ZodEffects<ZodObject<SortEntityOptional<F>, 'strict'>>;

export type SortRelation<E extends Entity> = {
  [k in keyof RelationTree<E>]: SortEntityOptionalObject<RelationTree<E>[k]>;
};

export type Sort<E extends Entity> = SortTarget<ResultGetField<E>['field']> &
  SortRelation<E>;

export type OptionalSort<E extends Entity> = {
  [k in keyof Sort<E>]: ZodOptional<Sort<E>[k]>;
};

type ZodBaseObjectSchema<E extends Entity> = ZodObject<Sort<E>, 'strict'>;
type OptionalZodBaseObjectSchema<E extends Entity> = ZodObject<
  OptionalSort<E>,
  'strict'
>;
export type ZodSortQuerySchema<E extends Entity> = ZodEffects<
  OptionalZodBaseObjectSchema<E>
>;

export const zodSortQuerySchema = <E extends Entity>(
  fields: ResultGetField<E>['field'],
  relation: RelationTree<E>
): ZodSortQuerySchema<E> => {
  const sortTargetObject = sortTarget(fields);

  const sortRelationObject = ObjectTyped.entries(relation).reduce(
    (acum, [item, fields]) => {
      return {
        ...acum,
        ...{
          [item]: z
            .object(sortEntity(fields))
            .strict()
            .refine(nonEmptyObject()),
        },
      };
    },
    {} as SortRelation<E>
  );

  const sortMerge: Sort<E> = {
    ...sortTargetObject,
    ...sortRelationObject,
  };

  const baseZodSchema: ZodBaseObjectSchema<E> = z.object(sortMerge).strict();

  const partialZod = baseZodSchema.partial() as OptionalZodBaseObjectSchema<E>;

  return partialZod.refine(
    nonEmptyObject()
  ) as unknown as ZodSortQuerySchema<E>;
};
