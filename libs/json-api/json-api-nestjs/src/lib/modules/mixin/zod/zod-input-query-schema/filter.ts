import {
  FilterOperand,
  isString,
  ObjectTyped,
} from '@klerick/json-api-nestjs-shared';
import { z, ZodType } from 'zod';

import { EntityParamMapService } from '../../service';
import { getRelationProps, oneOf, stringLongerThan } from '../zod-utils';
import {
  EntityParam,
  EntityRelationProps,
  UnionToTuple,
} from '../../../../types';

type FilterType = Partial<{
  [key in FilterOperand]: string | string[];
}>;

type OutPutFilter = {
  relation: null | Record<string, Record<string, FilterType>>;
  target: null | Record<string, FilterType>;
};

const arrayOp = {
  [FilterOperand.in]: true,
  [FilterOperand.nin]: true,
  [FilterOperand.some]: true,
};

function convertToFilterObject(
  value: Record<string, string> | string
): Partial<{
  [key in FilterOperand]: string | string[];
}> {
  if (isString<Record<string, string> | string, string>(value)) {
    return {
      [FilterOperand.eq]: value,
    };
  } else {
    return Object.entries(value).reduce((acum, [op, filed]) => {
      if (op in arrayOp) {
        acum[op] = (isString(filed) ? filed.split(',') : []).filter((i) => !!i);
      } else {
        acum[op] = filed;
      }
      return acum;
    }, {} as Record<string, string | string[]>);
  }
}

function getZodRulesForFilterOperator() {
  const filterConditional = z
    .union([z.string().refine(stringLongerThan()), z.null(), z.number()])
    .transform((r) => `${r}`);

  const conditional = z
    .object(
      ObjectTyped.values(FilterOperand).reduce((acum, item) => {
        acum[item] = filterConditional;
        return acum;
      }, {} as Record<keyof typeof FilterOperand, typeof filterConditional>)
    )
    .strict()
    .partial()
    .refine(oneOf(Object.values(FilterOperand)), {
      message: `Must have one of: "${Object.values(FilterOperand).join(
        '","'
      )}"`,
    });

  return z.union([filterConditional, conditional]).optional();
}

export type ZodRulesForFilterOperator = ReturnType<
  typeof getZodRulesForFilterOperator
>;

function getZodRulesForRelation() {
  return z
    .union([
      z
        .object({
          [FilterOperand.eq]: z
            .union([z.literal('null'), z.null()])
            .transform(() => null),
        })
        .strict(),
      z
        .object({
          [FilterOperand.ne]: z
            .union([z.literal('null'), z.null()])
            .transform(() => null),
        })
        .strict(),
    ])
    .optional();
}

type ZodRulesForRelation = ReturnType<typeof getZodRulesForRelation>;

export type ConcatRelationField<
  E extends object,
  IdKey extends string
> = UnionToTuple<
  {
    [K in keyof EntityRelationProps<E, IdKey>]: `${K &
      string}.${EntityRelationProps<E, IdKey>[K][number] & string}`;
  }[keyof EntityRelationProps<E, IdKey>]
>;

function getTupleConcatRelationFields<E extends object, IdKey extends string>(
  relationList: EntityRelationProps<E, IdKey>
): ConcatRelationField<E, IdKey> {
  const result: string[] = [];

  for (const [key, val] of ObjectTyped.entries(relationList)) {
    const relName = key.toString();
    for (const v of val) {
      result.push(`${relName}.${v}`);
    }
  }

  return result as ConcatRelationField<E, IdKey>;
}

export type ShapeArrayInput<E extends object, IdKey extends string> =
  | EntityParam<E, IdKey>['props']
  | EntityParam<E, IdKey>['relations']
  | ConcatRelationField<E, IdKey>;

export function shapeForArray<
  E extends object,
  Z extends ZodType,
  IdKey extends string,
  PropsList extends ShapeArrayInput<E, IdKey>
>(fields: PropsList, zodSchema: Z) {
  return fields.reduce(
    (acum, item) => ({
      ...acum,
      [item as PropertyKey]: zodSchema,
    }),
    {} as {
      [K in PropsList[number] & PropertyKey]: Z;
    }
  );
}

export function zodFilterInputQuery<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  const target = z.object(
    shapeForArray<
      E,
      ZodRulesForFilterOperator,
      IdKey,
      EntityParam<E, IdKey>['props']
    >(entityParamMapService.entityParaMap.props, getZodRulesForFilterOperator())
  );

  const relations = z.object(
    shapeForArray<
      E,
      ZodRulesForRelation,
      IdKey,
      EntityParam<E, IdKey>['relations']
    >(entityParamMapService.entityParaMap.relations, getZodRulesForRelation())
  );

  const relationList = getRelationProps(entityParamMapService);

  const relationFields = z.object(
    shapeForArray<
      E,
      ZodRulesForFilterOperator,
      IdKey,
      ConcatRelationField<E, IdKey>
    >(
      getTupleConcatRelationFields(relationList),
      getZodRulesForFilterOperator()
    )
  );
  return target
    .merge(relations)
    .merge(relationFields)
    .optional()
    .transform((data) => {
      if (!data) {
        return {
          relation: null,
          target: null,
        };
      }
      return Object.entries(data).reduce(
        (acum, [field, value]: [string, any]) => {
          const objectOperand = convertToFilterObject(value);
          if (Object.keys(objectOperand).length === 0) {
            return acum;
          }

          if (field.indexOf('.') > -1) {
            const [relation, fieldRelation] = field.split('.');
            acum['relation'] = !acum['relation'] ? {} : acum['relation'];
            acum['relation'][relation] = acum['relation'][relation] || {};
            acum['relation'][relation][fieldRelation] = objectOperand;
          } else {
            acum['target'] = !acum['target'] ? {} : acum['target'];
            acum['target'][field] = objectOperand;
          }

          return acum;
        },
        { relation: null, target: null } as OutPutFilter
      );
    });
}

export type ZodFilterInputQuery<
  E extends object,
  IdKey extends string
> = z.infer<ReturnType<typeof zodFilterInputQuery<E, IdKey>>>;
