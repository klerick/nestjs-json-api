import {
  z,
  ZodEffects,
  ZodLiteral,
  ZodObject,
  ZodOptional,
  ZodString,
  ZodUnion,
} from 'zod';
import { ZodFilterMap } from './select';
import { Entity, FilterOperand, ValueOf } from '../../../types';
import { ObjectTyped } from '../../utils';
import {
  getValidationErrorForStrict,
  nonEmptyObject,
  oneOf,
  stringLongerThan,
} from '../zod-utils';
import { ConcatRelation, ResultGetField } from '../../orm';

export type ZodFilterSchema = ZodEffects<
  ZodObject<
    {
      [key in ValueOf<typeof FilterOperand>]: ZodOptional<
        ZodEffects<ZodString>
      >;
    },
    'strict'
  >
>;
export const zodFilterSchema: ZodFilterSchema = z
  .object(
    ObjectTyped.values(FilterOperand).reduce((acum, item) => {
      acum[item] = z.string().refine(stringLongerThan());
      return acum;
    }, {} as Record<keyof typeof FilterOperand, ZodEffects<ZodString>>)
  )
  .partial()
  .strict()
  .refine(oneOf(Object.values(FilterOperand)), {
    message: `Must have one of: "${Object.values(FilterOperand).join('","')}"`,
  });

export type ZodFilterFieldSchema = ZodUnion<
  [ZodEffects<ZodString>, ZodFilterSchema]
>;
export const zodFilterFieldSchema: ZodFilterFieldSchema = z.union([
  z.string().refine(stringLongerThan()),
  zodFilterSchema,
]);

export type ZodFilterRelationSchema = ZodUnion<
  [
    ZodObject<{
      [FilterOperand.eq]: ZodLiteral<'null'>;
    }>,
    ZodObject<{
      [FilterOperand.ne]: ZodLiteral<'null'>;
    }>
  ]
>;
export const zodFilterRelationSchema: ZodFilterRelationSchema = z.union([
  z
    .object({
      [FilterOperand.eq]: z.literal('null'),
    })
    .strict(),
  z
    .object({
      [FilterOperand.ne]: z.literal('null'),
    })
    .strict(),
]);

export type ZodFilterInputMap<E extends Entity> = ZodFilterMap<
  ResultGetField<E>['field'],
  ZodFilterFieldSchema
> &
  ZodFilterMap<ResultGetField<E>['relations'], ZodFilterRelationSchema> &
  ZodFilterMap<ConcatRelation<E>, ZodFilterFieldSchema>;

export const getObjectForFilter = <
  E extends readonly [string, ...string[]],
  R extends boolean
>(
  fieldList: E,
  isRelation: R
): ZodFilterMap<
  E,
  R extends true ? ZodFilterRelationSchema : ZodFilterFieldSchema
> => {
  return fieldList.reduce(
    (acum, item) => ({
      ...acum,
      ...{
        [item]: isRelation
          ? zodFilterRelationSchema.optional()
          : zodFilterFieldSchema.optional(),
      },
    }),
    {} as ZodFilterMap<
      E,
      R extends true ? ZodFilterRelationSchema : ZodFilterFieldSchema
    >
  );
};

export type ZodFilterInputQueryObject<E extends Entity> = ZodObject<
  ZodFilterInputMap<E>,
  'strict'
>;

export type ZodFilterInputQuerySchema<E extends Entity> = ZodEffects<
  ZodFilterInputQueryObject<E>
>;

export const zodFilterInputQuerySchema = <E extends Entity>(
  field: ResultGetField<E>['field'],
  relations: ResultGetField<E>['relations'],
  relationField: ConcatRelation<E>
): ZodFilterInputQuerySchema<E> => {
  const filterMap: ZodFilterInputMap<E> = {
    ...getObjectForFilter(field, false),
    ...getObjectForFilter(relations, true),
    ...getObjectForFilter(relationField, false),
  };

  const zodFilterInputQueryObject: ZodFilterInputQueryObject<E> = z
    .object(filterMap)
    .strict(getValidationErrorForStrict(Object.keys(filterMap), 'Filter'));

  return zodFilterInputQueryObject.refine(nonEmptyObject(), {
    message: 'Validation error: Filter should be not empty',
  });
};
