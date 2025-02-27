import {
  FilterOperand,
  FilterOperandOnlyInNin,
  FilterOperandOnlySimple,
  ObjectTyped,
} from '@klerick/json-api-nestjs-shared';
import { z, ZodOptional } from 'zod';

import { EntityParamMapService } from '../../service';
import { EntityParam, TypeField, TypeOfConstructor } from '../../../../types';
import {
  arrayItemStringLongerThan,
  elementOfArrayMustBe,
  nonEmptyObject,
  oneOf,
  stringLongerThan,
  stringMustBe,
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

const zodRuleForArrayField = z
  .object({ [FilterOperand.some]: zodRuleStringArray })
  .strict();

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

function getZodRulesForRelationShape<E extends object, IdKey extends string>(
  shape: FilterProps<E, IdKey>
) {
  return z.object(shape).strict().optional().refine(nonEmptyObject());
}

type ZodRuleForString = typeof zodRuleForString;
type ZodRuleStringArray = typeof zodRuleStringArray;
type ZodRuleForArrayField = typeof zodRuleForArrayField;
type ZodRuleFilterRelationSchema = typeof zodRuleFilterRelationSchema;
type ZodRulesForField = ReturnType<typeof getZodRulesForField>;
type ZodRulesForRelationShape<
  E extends object,
  IdKey extends string
> = ReturnType<typeof getZodRulesForRelationShape<E, IdKey>>;

type RelTypeBase<
  E extends object,
  IdKey extends string,
  Rel extends keyof EntityParam<E, IdKey>['relationProperty']
> = TypeOfConstructor<
  EntityParam<E, IdKey>['relationProperty'][Rel]['entityClass']
>;

type RelType<
  E extends object,
  IdKey extends string,
  Rel extends keyof EntityParam<E, IdKey>['relationProperty']
> = RelTypeBase<E, IdKey, Rel> extends object
  ? RelTypeBase<E, IdKey, Rel>
  : never;

type RelationFilterProps<E extends object, IdKey extends string> = {
  [R in keyof EntityParam<
    E,
    IdKey
  >['relationProperty']]: ZodRulesForRelationShape<RelType<E, IdKey, R>, IdKey>;
};

export type FilterProps<E extends object, IdKey extends string> = {
  [Props in EntityParam<E, IdKey>['props'][number] &
    PropertyKey]: Props extends keyof E
    ? E[Props] extends TypeField.array
      ? ZodOptional<ZodRuleForArrayField>
      : ZodOptional<ZodRulesForField>
    : never;
};

type TargetRelationShape<E extends object, IdKey extends string> = {
  [Props in EntityParam<E, IdKey>['relations'][number] &
    PropertyKey]: ZodOptional<ZodRuleFilterRelationSchema>;
};

type ResultTargetType<E extends object, IdKey extends string> = FilterProps<
  E,
  IdKey
> &
  TargetRelationShape<E, IdKey>;

function getFilterPropsShapeForEntity<E extends object, IdKey extends string>(
  entityParam: EntityParam<E, IdKey>
): FilterProps<E, IdKey> {
  return entityParam.props.reduce((acum, field) => {
    const propertyType = Reflect.get(
      entityParam.propsType,
      field as PropertyKey
    );
    const value =
      propertyType === TypeField.array
        ? zodRuleForArrayField
        : getZodRulesForField(propertyType);

    Reflect.set(acum, field as PropertyKey, value.optional());

    return acum;
  }, {} as FilterProps<E, IdKey>);
}

export function zodFilterQuery<E extends object, IdKey extends string>(
  entityParamMapService: EntityParamMapService<E, IdKey>
) {
  const targetResult = entityParamMapService.entityParaMap.relations.reduce(
    (acum, item) => ({
      ...acum,
      [item as PropertyKey]: zodRuleFilterRelationSchema.optional(),
    }),
    getFilterPropsShapeForEntity(
      entityParamMapService.entityParaMap
    ) as ResultTargetType<E, IdKey>
  );

  const relationFilterProps = ObjectTyped.entries(
    entityParamMapService.entityParaMap.relationProperty
  ).reduce((acum, [relName, relProps]) => {
    type RT = TypeOfConstructor<typeof relProps.entityClass> extends object
      ? TypeOfConstructor<typeof relProps.entityClass>
      : never;
    const relParams = entityParamMapService.getParamMap(
      relProps.entityClass as any
    ) as EntityParam<RT, IdKey>;

    const zodFilter = getZodRulesForRelationShape(
      getFilterPropsShapeForEntity(relParams)
    );

    return {
      ...acum,
      [relName]: zodFilter.optional(),
    };
  }, {} as RelationFilterProps<E, IdKey>);

  const targetShapeFilter = {
    target: z
      .object(targetResult)
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

export type ZodFilterQuery<E extends object, IdKey extends string> = ReturnType<
  typeof zodFilterQuery<E, IdKey>
>;
export type FilterQuery<E extends object, IdKey extends string> = z.infer<
  ZodFilterQuery<E, IdKey>
>;
