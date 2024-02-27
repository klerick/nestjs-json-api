import {
  z,
  ZodEffects,
  ZodObject,
  ZodOptional,
  ZodString,
  ZodTypeAny,
} from 'zod';

import { ResultGetField } from '../../orm';
import { Entity } from '../../../types';
import { getValidationErrorForStrict, nonEmptyObject } from '../zod-utils';

export type ZodSelectFieldsInputQuerySchema<E extends Entity> = ZodEffects<
  ZodObject<
    ObjectForSelectField<ResultGetField<E>['relations'], ZodString>,
    'strict'
  >
>;

export type ZodFilterMap<
  R extends readonly [string, ...string[]],
  F extends ZodTypeAny
> = {
  [K in R[number]]: ZodOptional<F>;
};

type ObjectForSelectField<
  R extends readonly [string, ...string[]],
  K extends ZodTypeAny
> = {
  target: ZodOptional<K>;
} & ZodFilterMap<R, K>;

const objectForSelectField = <R extends readonly [string, ...string[]]>(
  relationList: R
): ObjectForSelectField<R, ZodString> => {
  const relation = relationList.reduce(
    (acum, item) => ({ ...acum, ...{ [item]: z.string().optional() } }),
    {} as ZodFilterMap<R, ZodString>
  );

  return {
    target: z.string().optional(),
    ...relation,
  };
};

export const zodSelectFieldsInputQuerySchema = <E extends Entity>(
  relationList: ResultGetField<E>['relations']
): ZodSelectFieldsInputQuerySchema<E> => {
  const resultShape: ObjectForSelectField<
    ResultGetField<E>['relations'],
    ZodString
  > = objectForSelectField<ResultGetField<E>['relations']>(relationList);

  return z
    .object(resultShape)
    .strict(getValidationErrorForStrict(['target', ...relationList], 'Fields'))
    .refine(nonEmptyObject(), {
      message: 'Validation error: Need select field for target or relation',
    });
};
