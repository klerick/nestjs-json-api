import { ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { z, ZodObject } from 'zod';

import { getRelationProps, nonEmptyObject, uniqueArray } from '../zod-utils';
import {
  EntityParam,
  EntityRelationProps,
  NonEmptyStringTuple,
} from '../../../../types';
import { EntityParamMapService } from '../../service';

function getZodFieldRule<
  E extends object,
  IdKey extends string,
  PropsList extends ShapeArrayInput<E, IdKey>
>(fields: PropsList) {
  const fieldsProps: NonEmptyStringTuple<PropsList> = fields as any;

  return z
    .enum(fieldsProps)
    .array()
    .nonempty()
    .refine(uniqueArray(), {
      error: 'Field should be unique',
    })
    .optional();
}

type ShapeArrayInput<E extends object, IdKey extends string> =
  | EntityParam<E, IdKey>['props']
  | EntityRelationProps<E, IdKey>[keyof EntityRelationProps<E, IdKey>];

type ZodFieldRule<
  E extends object,
  IdKey extends string,
  PropsList extends ShapeArrayInput<E, IdKey>
> = ReturnType<typeof getZodFieldRule<E, IdKey, PropsList>>;

export type ZodFieldsShape<E extends object, IdKey extends string> = {
  target: ZodFieldRule<E, IdKey, EntityParam<E, IdKey>['props']>;
} & {
  [K in keyof EntityRelationProps<E, IdKey>]: ZodFieldRule<
    E,
    IdKey,
    EntityRelationProps<E, IdKey>[K]
  >;
};

function getShapeFields<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
): ZodObject<ZodFieldsShape<E, IdKey>, z.core.$strict> {
  const relationList = getRelationProps(entityParamMapService);

  const fieldShape = ObjectTyped.entries(relationList).reduce(
    (acum, [key, val]) => ({
      ...acum,
      [key as PropertyKey]: getZodFieldRule<E, IdKey, typeof val>(val),
    }),
    {
      target: getZodFieldRule<E, IdKey, EntityParam<E, IdKey>['props']>(
        entityParamMapService.entityParaMap.props
      ),
    } as ZodFieldsShape<E, IdKey>
  );

  return z.strictObject(fieldShape, {
    error: (err) =>
      err.code === 'unrecognized_keys'
        ? 'Should be only target of relation'
        : err.message,
  });
}

export function zodFieldsQuery<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  return getShapeFields(entityParamMapService)
    .refine(nonEmptyObject(), {
      message: 'Validation error: Select target or relation fields',
    })
    .nullable();
}
export type ZodFieldsQuery<E extends object, IdKey extends string> = ReturnType<
  typeof zodFieldsQuery<E, IdKey>
>;
export type FieldsQuery<E extends object, IdKey extends string> = z.infer<
  ZodFieldsQuery<E, IdKey>
>;
