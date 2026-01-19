import { ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { z, ZodArray, ZodType } from 'zod';

import { EntityParam, TypeField, ExtractJsonApiReadOnlyKeys, ExtractJsonApiImmutableKeys } from '../../../../types';
import { nonEmptyObject, setOptionalOrNot } from '../zod-utils';
import { ResultSchema } from './type';
import { EntityParamMapService } from '../../service';
import { transformDateString } from '../map-transform-to-json-shema';

export function getZodRulesForNumber<
  Null extends true | false,
  isPatch extends true | false
>(isNullable: Null, isPatch: isPatch) {
  const schema = z.preprocess((x) => Number(x), z.number());
  return setOptionalOrNot(schema, isNullable, isPatch);
}

function getZodRulesForString<
  Null extends true | false,
  isPatch extends true | false
>(isNullable: Null, isPatch: isPatch) {
  return setOptionalOrNot(z.string(), isNullable, isPatch);
}

function getZodRulesForDate<
  Null extends true | false,
  isPatch extends true | false
>(isNullable: Null, isPatch: isPatch) {
  return setOptionalOrNot(z.iso.datetime(), isNullable, isPatch).transform(transformDateString<Null, isPatch>);
}

function getZodRulesForBoolean<
  Null extends true | false,
  isPatch extends true | false
>(isNullable: Null, isPatch: isPatch) {
  return setOptionalOrNot(z.boolean(), isNullable, isPatch);
}

function getZodSchemaForJson<
  Null extends true | false,
  isPatch extends true | false
>(isNullable: Null, isPatch: isPatch) {
  return setOptionalOrNot(z.json(), isNullable, isPatch);
}

type ZodRulesResultArray<
  T extends TypeField,
  Null extends true | false,
  isPatch extends true | false
> = ResultSchema<ZodArray<ZodRulesForType<T, false, false>>, Null, isPatch>;

function getZodRulesForArray<
  T extends TypeField,
  Null extends true | false,
  isPatch extends true | false
>(
  propsField: T,
  isNullable: Null,
  isPatch: isPatch
): ZodRulesResultArray<T, Null, isPatch> {
  let schema: ZodType;
  switch (propsField) {
    case TypeField.number:
      schema = getZodRulesForNumber(false, false);
      break;
    case TypeField.date:
      schema = getZodRulesForDate(false, false);
      break;
    case TypeField.boolean:
      schema = getZodRulesForBoolean(false, false);
      break;
    default:
      schema = getZodRulesForString(false, false);
  }

  return setOptionalOrNot(schema.array(), isNullable, isPatch) as ResultSchema<
    ZodArray<ZodRulesForType<T, false, false>>,
    Null,
    isPatch
  >;
}

type ZodRulesForArray<
  T extends TypeField,
  Null extends true | false,
  isPatch extends true | false
> = ReturnType<typeof getZodRulesForArray<T, Null, isPatch>>;

export type ZodRulesForType<
  T extends TypeField,
  Null extends true | false,
  isPatch extends true | false
> = ReturnType<
  T extends TypeField.date
    ? typeof getZodRulesForDate<Null, isPatch>
    : T extends TypeField.boolean
      ? typeof getZodRulesForBoolean<Null, isPatch>
      : T extends TypeField.number
        ? typeof getZodRulesForNumber<Null, isPatch>
        : T extends TypeField.object
          ? typeof getZodSchemaForJson<Null, isPatch>
          : typeof getZodRulesForString<Null, isPatch>
>;

export type IsNullableProps<
  E extends object,
  IdKey extends string,
  K extends keyof E
> = K extends EntityParam<E, IdKey>['propsNullable'][number] ? true : false;
type IsTypeArray<T extends TypeField> = T extends TypeField.array ? 1 : 0;
type Props<E extends object, IdKey extends string> = EntityParam<
  E,
  IdKey
>['propsType'];

type PropsArray<E extends object, IdKey extends string> = EntityParam<
  E,
  IdKey
>['propsArrayType'];

type OmitPrimary<E extends object, IdKey extends string> = Omit<
  Props<E, IdKey>,
  IdKey
>;

type ZodRules<
  E extends object,
  IdKey extends string,
  P extends keyof E,
  IsArray extends 1 | 0,
  isPatch extends boolean
> = IsArray extends 1
  ? P extends keyof PropsArray<E, IdKey>
    ? ZodRulesForArray<
      PropsArray<E, IdKey>[P],
      IsNullableProps<E, IdKey, P>,
      isPatch
    >
    : never
  : P extends keyof Props<E, IdKey>
    ? ZodRulesForType<Props<E, IdKey>[P], IsNullableProps<E, IdKey, P>, isPatch>
    : never;

export type ShapeAttributesType<
  E extends object,
  IdKey extends string,
  isPatch extends boolean
> = {
  [K in keyof OmitPrimary<E, IdKey>]: ZodRules<
    E,
    IdKey,
    K,
    IsTypeArray<OmitPrimary<E, IdKey>[K]>,
    isPatch
  >;
};

function assertPropsIsarrayProps<E extends object, IdKey extends string>(
  paramMap: EntityParam<E, IdKey>,
  propsName: unknown
): propsName is keyof PropsArray<E, IdKey> {
  return Reflect.get(paramMap.propsType, `${propsName}`) === TypeField.array;
}

function buildSchema<
  E extends object,
  IdKey extends string,
  isPatch extends boolean,
  K extends keyof Props<E, IdKey>
>(
  paramMap: EntityParam<E, IdKey>,
  propsName: K,
  isPatch: isPatch
): ZodRules<E, IdKey, K, IsTypeArray<Props<E, IdKey>[K]>, isPatch> {
  // @ts-expect-error need check in tuple
  const isNullable = paramMap.propsNullable.includes(propsName);
  if (assertPropsIsarrayProps(paramMap, propsName)) {
    const arrayPropsType = paramMap.propsArrayType[propsName];

    return getZodRulesForArray(arrayPropsType, isNullable, isPatch) as ZodRules<
      E,
      IdKey,
      K,
      IsTypeArray<Props<E, IdKey>[K]>,
      isPatch
    >;
  }

  const propsType = paramMap.propsType[propsName];
  switch (propsType) {
    case TypeField.date:
      return getZodRulesForDate(isNullable, isPatch) as ZodRules<
        E,
        IdKey,
        K,
        IsTypeArray<Props<E, IdKey>[K]>,
        isPatch
      >;
    case TypeField.boolean:
      return getZodRulesForBoolean(isNullable, isPatch) as ZodRules<
        E,
        IdKey,
        K,
        IsTypeArray<Props<E, IdKey>[K]>,
        isPatch
      >;
    case TypeField.number:
      return getZodRulesForNumber(isNullable, isPatch) as ZodRules<
        E,
        IdKey,
        K,
        IsTypeArray<Props<E, IdKey>[K]>,
        isPatch
      >;
    case TypeField.object:
      return getZodSchemaForJson(isNullable, isPatch) as ZodRules<
        E,
        IdKey,
        K,
        IsTypeArray<Props<E, IdKey>[K]>,
        isPatch
      >;
    default:
      return getZodRulesForString(isNullable, isPatch) as ZodRules<
        E,
        IdKey,
        K,
        IsTypeArray<Props<E, IdKey>[K]>,
        isPatch
      >;
  }
}

function assertOmitKeysProps<E extends object, IdKey extends string>(
  primaryColumnName: EntityParam<E, IdKey>['primaryColumnName'],
  key: keyof Props<E, IdKey>
): key is keyof OmitPrimary<E, IdKey> {
  return !(key.toString() === primaryColumnName);
}

export function zodAttributes<
  E extends object,
  IdKey extends string,
  S extends true | false = false
>(
  entityParamMapService: EntityParamMapService<E, IdKey>,
  isPatch: S,
  readOnlyProps: ExtractJsonApiReadOnlyKeys<E>[] = [],
  immutableProps: ExtractJsonApiImmutableKeys<E>[] = []
) {
  type K = keyof Props<E, IdKey>;
  const paramsMap = entityParamMapService.entityParaMap;

  const excludeProps = isPatch
    ? [...readOnlyProps, ...immutableProps]
    : readOnlyProps;

  const objectShape = ObjectTyped.keys(paramsMap.propsType).reduce(
    (acum, key) => {
      if (
        assertOmitKeysProps(paramsMap.primaryColumnName, key) &&
        !excludeProps.includes(key as unknown as ExtractJsonApiReadOnlyKeys<E>)
      ) {
        const isImmutable = immutableProps.includes(key as unknown as ExtractJsonApiImmutableKeys<E>);
        const schema = buildSchema(paramsMap, key, isPatch || isImmutable);
        acum[key] = schema as ZodRules<E, IdKey, K, IsTypeArray<Props<E, IdKey>[K]>, S>;
      }

      return acum;
    },
    {} as ShapeAttributesType<E, IdKey, S>
  );

  return z.object(objectShape).strict().refine(nonEmptyObject());
}

export type ZodAttributes<
  E extends object,
  IdKey extends string,
  K extends true | false = false
> = ReturnType<typeof zodAttributes<E, IdKey, K>>;
export type Attributes<
  E extends object,
  IdKey extends string,
  K extends true | false = false
> = z.infer<ZodAttributes<E, IdKey, K>>;
