import {
  FilterOperand,
  ObjectTyped,
  isString,
} from '../../../../utils/nestjs-shared';
import { z } from 'zod';

import {
  RelationTree,
  ResultGetField,
  UnionToTuple,
  ZodInfer,
} from '../../types';
import { ObjectLiteral } from '../../../../types';

import { oneOf, stringLongerThan } from '../zod-utils';

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

type FilterType = Partial<{
  [key in FilterOperand]: string | string[];
}>;

type OutPutFilter = {
  relation: null | Record<string, Record<string, FilterType>>;
  target: null | Record<string, FilterType>;
};

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

function shapeForArray<
  R extends readonly [string, ...string[]],
  Z extends ZodRulesForRelation | ZodRulesForFilterOperator
>(fields: R, zodSchema: Z) {
  return fields.reduce(
    (acum, item) => ({
      ...acum,
      [item]: zodSchema,
    }),
    {} as {
      [K in R[number]]: Z;
    }
  );
}

function getTupleConcatRelationFields<E extends ObjectLiteral>(
  relationList: RelationTree<E>
): UnionToTuple<
  {
    [K in keyof RelationTree<E>]: `${K & string}.${RelationTree<E>[K][number]}`;
  }[keyof RelationTree<E>]
> {
  const result: string[] = [];

  for (const [key, val] of ObjectTyped.entries(relationList)) {
    const relName = key.toString();
    for (const v of val) {
      result.push(`${relName}.${v}`);
    }
  }

  return result as any;
}

type ZodRulesForRelation = ReturnType<typeof getZodRulesForRelation>;
type ZodRulesForFilterOperator = ReturnType<
  typeof getZodRulesForFilterOperator
>;

export function zodFilterInputQuery<E extends ObjectLiteral>(
  fields: ResultGetField<E>['field'],
  relationList: RelationTree<E>
) {
  const target = z.object(
    shapeForArray(fields, getZodRulesForFilterOperator())
  );

  const relationTuple = ObjectTyped.keys(relationList) as UnionToTuple<
    keyof RelationTree<E>
  >;

  const relations = z.object(
    shapeForArray(relationTuple, getZodRulesForRelation())
  );

  const relationFields = z.object(
    shapeForArray(
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

export type ZodFilterInputQuery<E extends ObjectLiteral> = ZodInfer<
  typeof zodFilterInputQuery<E>
>;
