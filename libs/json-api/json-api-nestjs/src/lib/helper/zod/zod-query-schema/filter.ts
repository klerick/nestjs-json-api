import {
  z,
  ZodArray,
  ZodEffects,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodString,
} from 'zod';
import {
  arrayItemStringLongerThan,
  elementOfArrayMustBe,
  nonEmptyObject,
  oneOf,
  stringLongerThan,
  stringMustBe,
} from '../zod-utils';
import {
  CastProps,
  Entity,
  EntityProps,
  FilterOperand,
  IsArray,
  TypeCast,
  TypeOfArray,
  ValueOf,
} from '../../../types';
import { ObjectTyped } from '../../utils';
import {
  AllFieldWithTpe,
  ArrayPropsForEntity,
  guardIsKeyOfObject,
  PropsArray,
  RelationTree,
  ResultGetField,
  TypeField,
} from '../../orm';

import {
  zodFilterRelationSchema,
  ZodFilterRelationSchema,
} from '../zod-input-query-schema/filter';

type ZodForString = ZodEffects<ZodString>;
const zodForString: ZodForString = z.string().refine(stringLongerThan(), {
  message: 'String should be not empty',
});

type ZodForStringArray = ZodEffects<
  ZodArray<ZodForString, 'atleastone'>,
  string[],
  string[]
>;
const zodForStringArray: ZodForStringArray = zodForString
  .array()
  .nonempty()
  .refine(arrayItemStringLongerThan(0), {
    message: 'Array should be not empty',
  });

type OperandForString = Exclude<
  ValueOf<typeof FilterOperand>,
  FilterOperand.in | FilterOperand.nin | FilterOperand.some
>;
type OperandForArray = Extract<
  ValueOf<typeof FilterOperand>,
  FilterOperand.in | FilterOperand.nin
>;

type OperandForArrayField = FilterOperand.some;

type MapOperandForString = {
  [K in OperandForString]: ZodOptional<ZodForString>;
};

type MapOperandForArrayString = {
  [K in OperandForArray]: ZodOptional<ZodForStringArray>;
};

type MapOperand = MapOperandForString & MapOperandForArrayString;
type ZodOperand = ZodEffects<ZodObject<MapOperand, 'strict'>>;
type ZodOperandForArrayField = ZodObject<
  {
    [K in OperandForArrayField]: ZodForStringArray;
  },
  'strict'
>;

const arrayOperand: { [K in OperandForArray]: boolean } = {
  [FilterOperand.nin]: true,
  [FilterOperand.in]: true,
};

const shapeMapOperand = (type: TypeField = TypeField.string): ZodOperand =>
  z
    .object(
      ObjectTyped.entries(FilterOperand)
        .filter(([key]) => key !== FilterOperand.some)
        .reduce(
          (acum, [key, val]) => ({
            ...acum,
            [val]: (Object.prototype.hasOwnProperty.call(arrayOperand, key)
              ? zodForStringArray.refine(elementOfArrayMustBe(type), {
                  message: `String should be as ${type}`,
                })
              : zodForString.refine(stringMustBe(type), {
                  message: `String should be as ${type}`,
                })
            ).optional(),
          }),
          {} as MapOperand
        )
    )
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

const shapeForArrayField: ZodOperandForArrayField = z
  .object({ [FilterOperand.some]: zodForStringArray })
  .strict();

type FilterProps<E extends Entity, P extends readonly [string, ...string[]]> = {
  [Props in P[number]]: Props extends keyof E
    ? IsArray<E[Props]> extends true
      ? ZodOptional<ZodOperandForArrayField>
      : ZodOptional<ZodOperand>
    : never;
};

type FilterTargetRelation<P extends readonly [string, ...string[]]> = {
  [Props in P[number]]: ZodOptional<ZodFilterRelationSchema>;
};

const getFilterProps = <E extends Entity>(
  field: ResultGetField<E>['field'],
  propsArray: PropsArray<E>,
  propsType: AllFieldWithTpe<E>
): FilterProps<E, ResultGetField<E>['field']> =>
  field.reduce(
    (acum, item) => ({
      ...acum,
      [item]: (Reflect.get(propsArray, item)
        ? shapeForArrayField
        : shapeMapOperand(propsType[item as EntityProps<E>])
      ).optional(),
    }),
    {} as FilterProps<E, ResultGetField<E>['field']>
  );

type TargetRelation<E extends Entity> = FilterTargetRelation<
  ResultGetField<E>['relations']
>;
type TargetProps<E extends Entity> = FilterProps<
  E,
  ResultGetField<E>['field']
> &
  TargetRelation<E>;

type Target<E extends Entity> = {
  target: ZodNullable<ZodEffects<ZodObject<TargetProps<E>, 'strict'>>>;
};

type RelationType<E extends Entity, R> = TypeCast<
  TypeOfArray<CastProps<E, R>>,
  Entity
>;

type RelationFilter<E extends Entity> = ZodOptional<
  ZodEffects<ZodObject<FilterProps<E, ResultGetField<E>['field']>, 'strict'>>
>;

type Relation<E extends Entity> = {
  [R in keyof RelationTree<E>]: RelationFilter<RelationType<E, R>>;
};

type ZodObjectRelation<E extends Entity> = ZodNullable<
  ZodEffects<ZodObject<Relation<E>, 'strict'>>
>;

type ShapeFilter<E extends Entity> = Target<E> & {
  relation: ZodObjectRelation<E>;
};

export type ZodFilterQuerySchema<E extends Entity> = ZodEffects<
  ZodObject<ShapeFilter<E>>
>;

export const zodFilterQuerySchema = <E extends Entity>(
  field: ResultGetField<E>['field'],
  relationTree: RelationTree<E>,
  propsArray: ArrayPropsForEntity<E>,
  propsType: AllFieldWithTpe<E>
): ZodFilterQuerySchema<E> => {
  const { target: propsArrayTarget, ...relationPropsArray } = propsArray;

  const targetShape: FilterProps<E, ResultGetField<E>['field']> =
    getFilterProps<E>(field, propsArrayTarget, propsType);

  const targetRelation = ObjectTyped.keys(relationTree).reduce(
    (acum, item) => ({
      ...acum,
      [item]: zodFilterRelationSchema.optional(),
    }),
    {} as TargetRelation<E>
  );

  const targetProps: TargetProps<E> = {
    ...targetShape,
    ...targetRelation,
  };

  const target: Target<E> = {
    target: z.object(targetProps).strict().refine(nonEmptyObject()).nullable(),
  };

  const relationPlaceHolder = ObjectTyped.keys(relationTree).reduce(
    (acum, item) => {
      acum[item] = undefined;
      return acum;
    },
    {} as { [K in keyof RelationTree<E>]: undefined }
  );
  const relation = ObjectTyped.keys(relationTree).reduce((acum, name) => {
    type F = typeof name;
    type RT = RelationType<E, F>;
    type RTF = ResultGetField<RT>['field'];

    const relationField = relationTree[name] as RTF;
    guardIsKeyOfObject(relationPropsArray, name);

    const propsArrayForRelation = relationPropsArray[name] as PropsArray<RT>;

    const filterProps = getFilterProps<RT>(
      relationField,
      propsArrayForRelation,
      propsType[name] as AllFieldWithTpe<RT>
    );
    const zodFilter: RelationFilter<RT> = z
      .object(filterProps)
      .strict()
      .refine(nonEmptyObject())
      .optional();
    const newName: any = name;
    guardIsKeyOfObject(relationPlaceHolder, newName);

    acum[newName] = zodFilter;
    return acum;
  }, {} as Relation<E>);

  const zodObjectRelation: ZodObjectRelation<E> = z
    .object(relation)
    .strict()
    .refine(nonEmptyObject())
    .nullable();

  const shapeFilter: ShapeFilter<E> = {
    ...target,
    ['relation']: zodObjectRelation,
  };

  return z.object(shapeFilter).strict().refine(nonEmptyObject());
};
