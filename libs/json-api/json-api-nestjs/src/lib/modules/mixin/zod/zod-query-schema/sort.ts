import { ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { z, ZodObject } from 'zod';

import { EntityParam, EntityRelationProps } from '../../../../types';
import { SORT_TYPE } from '../../../../constants';
import { getRelationProps, nonEmptyObject } from '../zod-utils';
import { EntityParamMapService } from '../../service';

function getZodSortRule() {
  return z.enum(SORT_TYPE).optional();
}

function getZodFieldRule<
  E extends object,
  IdKey extends string,
  PropsList extends ShapeArrayInput<E, IdKey>
>(fields: PropsList, zodSchema: ZodSortRule) {
  const targetShape = fields.reduce(
    (acum, item) => ({
      ...acum,
      [item as PropertyKey]: zodSchema,
    }),
    {} as { [K in PropsList[number] & PropertyKey]: ZodSortRule }
  );

  return z.object(targetShape).strict().refine(nonEmptyObject()).optional();
}

type ShapeArrayInput<E extends object, IdKey extends string> =
  | EntityParam<E, IdKey>['props']
  | EntityRelationProps<E, IdKey>[keyof EntityRelationProps<E, IdKey>];

type ZodSortRule = ReturnType<typeof getZodSortRule>;
type ZodFieldRule<
  E extends object,
  IdKey extends string,
  PropsList extends ShapeArrayInput<E, IdKey>
> = ReturnType<typeof getZodFieldRule<E, IdKey, PropsList>>;

type ZodSortTarget<E extends object, IdKey extends string> = {
  target: ZodFieldRule<E, IdKey, EntityParam<E, IdKey>['props']>;
};

type ZodSortRelation<E extends object, IdKey extends string> = {
  [K in keyof EntityRelationProps<E, IdKey>]: ZodFieldRule<
    E,
    IdKey,
    EntityRelationProps<E, IdKey>[K]
  >;
};
type ZodSortShape<E extends object, IdKey extends string> = ZodSortTarget<
  E,
  IdKey
> &
  ZodSortRelation<E, IdKey>;

function zodSortObject<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
): ZodObject<ZodSortShape<E, IdKey>, 'strict'> {
  const zodSortRule = getZodSortRule();
  const relationList = getRelationProps(entityParamMapService);

  const sortShape = ObjectTyped.entries(relationList).reduce(
    (acum, [key, val]) => ({
      ...acum,
      [key as PropertyKey]: getZodFieldRule<E, IdKey, typeof val>(
        val,
        zodSortRule
      ),
    }),
    {
      target: getZodFieldRule<E, IdKey, EntityParam<E, IdKey>['props']>(
        entityParamMapService.entityParaMap.props,
        zodSortRule
      ),
    } as ZodSortShape<E, IdKey>
  );

  return z.object(sortShape).strict();
}

export function zodSortQuery<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  return zodSortObject(entityParamMapService)
    .partial()
    .refine(nonEmptyObject())
    .nullable();
}

export type ZodSortQuery<E extends object, IdKey extends string> = ReturnType<
  typeof zodSortQuery<E, IdKey>
>;
export type SortQuery<E extends object, IdKey extends string> = z.infer<
  ZodSortQuery<E, IdKey>
>;
