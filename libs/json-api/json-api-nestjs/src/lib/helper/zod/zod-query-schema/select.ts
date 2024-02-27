import {
  Writeable,
  z,
  ZodArray,
  ZodEffects,
  ZodEnum,
  ZodObject,
  ZodOptional,
} from 'zod';

import { Entity } from '../../../types';
import { RelationTree, ResultGetField } from '../../orm';
import { ObjectTyped } from '../../utils';
import { nonEmptyObject, uniqueArray } from '../zod-utils';

type ZodField<R extends readonly [string, ...string[]]> = ZodEffects<
  ZodArray<ZodEnum<Writeable<R>>, 'atleastone'>,
  [Writeable<R>[number], ...Writeable<R>[number][]],
  [Writeable<R>[number], ...Writeable<R>[number][]]
>;

const zodFields = <R extends readonly [string, ...string[]]>(
  fields: R
): ZodField<R> =>
  z.enum(fields).array().nonempty().refine(uniqueArray(), {
    message: 'Field should be unique',
  });

type ZodTarget<R extends readonly [string, ...string[]]> = {
  target: ZodOptional<ZodField<R>>;
};

export const zodTarget = <R extends readonly [string, ...string[]]>(
  fields: R
): ZodTarget<R> => ({
  target: zodFields([...fields]).optional(),
});

type ZodRelation<E extends Entity> = {
  [K in keyof RelationTree<E>]: ZodOptional<ZodField<RelationTree<E>[K]>>;
};

type ZodResultShape<E extends Entity> = ZodTarget<ResultGetField<E>['field']> &
  ZodRelation<E>;

export type ZodSelectFields<E extends Entity> = ZodEffects<
  ZodObject<ZodResultShape<E>, 'strict'>
>;

export type ZodSelectFieldsQuerySchema<E extends Entity> = ZodEffects<
  ZodSelectFields<E>
>;
export const zodSelectFieldsQuerySchema = <E extends Entity>(
  fields: ResultGetField<E>['field'],
  relationList: RelationTree<E>
): ZodSelectFieldsQuerySchema<E> => {
  const target: ZodTarget<ResultGetField<E>['field']> = zodTarget(fields);

  const relation = ObjectTyped.entries(relationList).reduce(
    (acum, [key, val]) => {
      acum[key] = zodFields(val).optional();
      return acum;
    },
    {} as ZodRelation<E>
  );

  const resultShape: ZodResultShape<E> = {
    ...target,
    ...relation,
  };
  const zodSelectFields = z
    .object(resultShape)
    .strict('Should be only target of relation ');
  // @ts-ignore
  return zodSelectFields.refine(nonEmptyObject(), {
    message: 'Validation error: Select target or relation fields',
  }) as unknown as ZodSelectFieldsQuerySchema<E>;
};
