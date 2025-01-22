import { z, ZodOptional } from 'zod';
import {
  FilterOperand,
  ObjectTyped,
  FilterOperandOnlyInNin,
  FilterOperandOnlySimple,
} from '@klerick/json-api-nestjs-shared';

import {
  AllFieldWithType,
  ArrayPropsForEntity,
  RelationTree,
  ResultGetField,
  IsArray,
  TypeField,
  EntityProps,
  TypeOfArray,
  CastProps,
  TypeCast,
  PropsArray,
} from '../../types';
import { ObjectLiteral } from '../../../../types';
import {
  stringLongerThan,
  arrayItemStringLongerThan,
  stringMustBe,
  elementOfArrayMustBe,
  oneOf,
  guardIsKeyOfObject,
  nonEmptyObject,
} from '../zod-utils';

const zodRuleForString = z.union([
  z.literal('null').transform(() => null),
  z.string().refine(stringLongerThan(), {
    message: 'String should be not empty',
  }),
]);

const zodRuleStringArray = zodRuleForString
  .array()
  .nonempty()
  .refine(arrayItemStringLongerThan(0), {
    message: 'Array should be not empty',
  });

const zodNullRule = z.union([
  z.literal('null'),
  z.literal(null).transform((r) => 'null' as const),
]);

const zodRuleFilterRelationSchema = z.union([
  z
    .object({
      [FilterOperand.eq]: zodNullRule,
    })
    .strict(),
  z
    .object({
      [FilterOperand.ne]: zodNullRule,
    })
    .strict(),
]);
const zodRuleForArrayField = z
  .object({ [FilterOperand.some]: zodRuleStringArray })
  .strict();

function getZodRulesForField(type: TypeField = TypeField.string) {
  const simpleShape = ObjectTyped.entries(FilterOperandOnlySimple).reduce(
    (acum, [key, val]) => ({
      ...acum,
      [val]: zodRuleForString
        .refine(stringMustBe(type), {
          message: `String should be as ${type}`,
        })
        .optional(),
    }),
    {} as {
      [K in FilterOperandOnlySimple]: ZodOptional<ZodRuleForString>;
    }
  );

  const ninInShape = ObjectTyped.entries(FilterOperandOnlyInNin).reduce(
    (acum, [key, val]) => ({
      ...acum,
      [val]: zodRuleStringArray
        .refine(elementOfArrayMustBe(type), {
          message: `String should be as ${type}`,
        })
        .optional(),
    }),
    {} as {
      [K in FilterOperandOnlyInNin]: ZodOptional<ZodRuleStringArray>;
    }
  );
  return z
    .object({
      ...simpleShape,
      ...ninInShape,
    })
    .strict()
    .refine(
      oneOf(
        Object.values(FilterOperand).filter((i) => i !== FilterOperand.some)
      ),
      {
        message: `Must have one of: "${Object.values(FilterOperand)
          .filter((i) => i !== FilterOperand.some)
          .join('","')}"`,
      }
    );
}

function getFilterPropsShapeForEntity<E extends ObjectLiteral>(
  fields: ResultGetField<E>['field'],
  propsArrayTarget: PropsArray<E>,
  propsType: AllFieldWithType<E>
) {
  return fields.reduce(
    (acum, field) => ({
      ...acum,
      [field]: (Reflect.get(propsArrayTarget, field)
        ? zodRuleForArrayField
        : getZodRulesForField(propsType[field as EntityProps<E>])
      ).optional(),
    }),
    {} as FilterProps<E, ResultGetField<E>['field']>
  );
}

function getZodRulesForRelationShape<E extends ObjectLiteral>(
  shape: FilterProps<E, ResultGetField<E>['field']>
) {
  return z.object(shape).strict().optional().refine(nonEmptyObject());
}

type ZodRuleForString = typeof zodRuleForString;
type ZodRuleStringArray = typeof zodRuleStringArray;
type ZodRuleFilterRelationSchema = typeof zodRuleFilterRelationSchema;
type ZodRuleForArrayField = typeof zodRuleForArrayField;
type ZodRulesForField = ReturnType<typeof getZodRulesForField>;
type ZodRulesForRelationShape<E extends ObjectLiteral> = ReturnType<
  typeof getZodRulesForRelationShape<E>
>;

type FilterProps<
  E extends ObjectLiteral,
  P extends readonly [string, ...string[]]
> = {
  [Props in P[number]]: Props extends keyof E
    ? IsArray<E[Props]> extends true
      ? ZodOptional<ZodRuleForArrayField>
      : ZodOptional<ZodRulesForField>
    : never;
};

type RelationType<E extends ObjectLiteral, R> = TypeCast<
  TypeOfArray<CastProps<E, R>>,
  ObjectLiteral
>;

type RelationFilterProps<E extends ObjectLiteral> = {
  [R in keyof RelationTree<E>]: ZodRulesForRelationShape<TypeOfArray<E[R]>>;
};

export function zodFilterQuery<E extends ObjectLiteral>(
  fields: ResultGetField<E>['field'],
  relationTree: RelationTree<E>,
  propsArray: ArrayPropsForEntity<E>,
  propsType: AllFieldWithType<E>
) {
  const { target: propsArrayTarget, ...otherRelationPropsArray } = propsArray;

  const fieldsFilterProps = getFilterPropsShapeForEntity(
    fields,
    propsArrayTarget,
    propsType
  );

  const targetRelation = ObjectTyped.keys(relationTree).reduce(
    (acum, item) => ({
      ...acum,
      [item]: zodRuleFilterRelationSchema.optional(),
    }),
    {} as {
      [K in ResultGetField<E>['relations'][number]]: ZodOptional<ZodRuleFilterRelationSchema>;
    }
  );

  const relationFilterProps = ObjectTyped.keys(relationTree).reduce(
    (acum, name) => {
      type F = typeof name;
      type RT = RelationType<E, F>;
      type RTF = ResultGetField<RT>['field'];

      guardIsKeyOfObject(otherRelationPropsArray, name);
      const relationField = relationTree[name] as RTF;
      const relationPropsArray = otherRelationPropsArray[
        name
      ] as PropsArray<RT>;
      const relationPropsType = propsType[name] as AllFieldWithType<RT>;

      const filterProps = getFilterPropsShapeForEntity<RT>(
        relationField,
        relationPropsArray,
        relationPropsType
      );

      const zodFilter = getZodRulesForRelationShape(filterProps);

      return {
        ...acum,
        [name]: zodFilter.optional(),
      };
    },
    {} as RelationFilterProps<E>
  );

  const targetShapeFilter = {
    target: z
      .object({
        ...fieldsFilterProps,
        ...targetRelation,
      })
      .strict()
      .optional()
      .refine(nonEmptyObject())
      .nullable(),
    relation: z
      .object(relationFilterProps)
      .strict()
      .optional()
      .refine(nonEmptyObject())
      .nullable(),
  };

  return z.object(targetShapeFilter).strict().refine(nonEmptyObject());
}

export type ZodFilterQuery<E extends ObjectLiteral> = ReturnType<
  typeof zodFilterQuery<E>
>;
export type FilterQuery<E extends ObjectLiteral> = z.infer<ZodFilterQuery<E>>;
