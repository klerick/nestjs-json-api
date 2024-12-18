import { Repository } from 'typeorm';
import { Type } from '@nestjs/common';
import {
  CastProps,
  Concat,
  Entity,
  EntityProps,
  EntityPropsArray,
  EntityRelation,
  IsArray,
  TypeCast,
  TypeOfArray,
  UnionToTuple,
  ValueOf,
} from '../../types';
import { getEntityName, ObjectTyped } from '../utils';
import { guardKeyForPropertyTarget } from './orm-type-asserts';
import { ColumnType } from 'typeorm/driver/types/ColumnTypes';

export enum PropsNameResultField {
  field = 'field',
  relations = 'relations',
}

export type ResultGetField<E extends Entity> = {
  [PropsNameResultField.field]: TupleOfEntityProps<E>;
  [PropsNameResultField.relations]: TupleOfEntityRelation<E>;
};

export type TupleOfEntityProps<
  E,
  Props = UnionToTuple<EntityProps<E>>
> = Props extends readonly [string, ...string[]] ? Props : never;
export type TupleOfEntityRelation<
  E,
  Props = UnionToTuple<EntityRelation<E>>
> = Props extends readonly [string, ...string[]] ? Props : never;

export type RelationTree<E extends Entity> = {
  [K in keyof RelationType<E>]: TypeOfArray<E[K]> extends Entity
    ? ResultGetField<TypeOfArray<E[K]>>['field']
    : never;
};

export type ConcatFieldWithRelation<
  R extends string,
  T extends readonly string[]
> = ValueOf<{
  [K in T[number]]: Concat<R, K>;
}>;

export type ConcatRelationUnion<
  E extends Entity,
  R = RelationTree<E>
> = ValueOf<{
  [K in keyof R]: ConcatFieldWithRelation<
    TypeCast<K, string>,
    TypeCast<R[K], readonly string[]>
  >;
}>;

export type ConcatRelation<E extends Entity> = TypeCast<
  UnionToTuple<ConcatRelationUnion<E>>,
  [string, ...string[]]
>;

type RelationType<E extends Entity> = {
  [K in EntityRelation<E>]: Type<TypeOfArray<CastProps<E, K>>>;
};

export enum TypeField {
  array = 'array',
  date = 'date',
  number = 'number',
  boolean = 'boolean',
  string = 'string',
  object = 'object',
}

export type TypeForId = Extract<TypeField, TypeField.number | TypeField.string>;

export type FieldWithType<E extends Entity> = {
  [K in EntityProps<E>]: IsArray<E[K]> extends true
    ? TypeField.array
    : E[K] extends Date
    ? TypeField.date
    : E[K] extends number
    ? TypeField.number
    : E[K] extends boolean
    ? TypeField.boolean
    : E[K] extends object
    ? TypeField.object
    : TypeField.string;
};

export type RelationPropsType<E extends Entity> = {
  [K in EntityRelation<E>]: E[K] extends unknown[] ? true : false;
};

export type RelationPropsTypeName<E extends Entity> = {
  [K in EntityRelation<E>]: string;
};

export type RelationPrimaryColumnType<E extends Entity> = {
  [K in EntityRelation<E>]: TypeForId;
};

export const getRelationTypeArray = <E extends Entity>(
  repository: Repository<E>
): RelationPropsType<E> => {
  const { relations } = getField(repository);

  const entity = repository.target as any;
  const result = {} as any;
  for (const item of relations) {
    result[item] =
      Reflect.getMetadata('design:type', entity['prototype'], item) === Array;
  }
  return result;
};

export const getTypePrimaryColumn = <E extends Entity>(
  repository: Repository<E>
): TypeForId => {
  const target = repository.target as any;
  const primaryColumn = repository.metadata.primaryColumns[0].propertyName;

  return Reflect.getMetadata(
    'design:type',
    target['prototype'],
    primaryColumn
  ) === Number
    ? TypeField.number
    : TypeField.string;
};

export const getRelationTypePrimaryColumn = <E extends Entity>(
  repository: Repository<E>
): RelationPrimaryColumnType<E> => {
  return repository.metadata.relations.reduce((acum, i) => {
    const target = i.inverseEntityMetadata.target as any;
    const primaryColumn =
      i.inverseEntityMetadata.primaryColumns[0].propertyName;
    acum[i.propertyName] =
      Reflect.getMetadata('design:type', target['prototype'], primaryColumn) ===
      Number
        ? TypeField.number
        : TypeField.string;
    return acum;
  }, {} as Record<string, TypeField>) as RelationPrimaryColumnType<E>;
};

export const getPrimaryColumnsForRelation = <E extends Entity>(
  repository: Repository<E>
): RelationPropsTypeName<E> => {
  return repository.metadata.relations.reduce((acum, i) => {
    const target = i.inverseEntityMetadata.target as any;
    acum[i.propertyName] =
      i.inverseEntityMetadata.primaryColumns[0].propertyName;
    return acum;
  }, {} as Record<string, string>) as RelationPropsTypeName<E>;
};

export const getRelationTypeName = <E extends Entity>(
  repository: Repository<E>
): RelationPropsTypeName<E> => {
  return repository.metadata.relations.reduce((acum, i) => {
    acum[i.propertyName] = getEntityName(i.inverseEntityMetadata.target);
    return acum;
  }, {} as Record<string, string>) as RelationPropsTypeName<E>;
};

export const getFieldWithType = <E extends Entity>(
  repository: Repository<E>
): FieldWithType<E> => {
  const { field } = getField(repository);

  const entity = repository.target as any;
  const result = {} as any;
  for (const item of field) {
    let typeProps: TypeField = TypeField.string;
    switch (Reflect.getMetadata('design:type', entity['prototype'], item)) {
      case Array:
        typeProps = TypeField.array;
        break;
      case Date:
        typeProps = TypeField.date;
        break;
      case Number:
        typeProps = TypeField.number;
        break;
      case Boolean:
        typeProps = TypeField.boolean;
        break;
      case Object:
        typeProps = TypeField.object;
        break;
      default:
        typeProps = TypeField.string;
    }
    result[item] = typeProps;
  }

  return result;
};

export const getField = <E extends Entity>(
  repository: Repository<E>
): ResultGetField<E> => {
  const relations = repository.metadata.relations.map((i) => {
    return i.propertyName;
  });

  const field = repository.metadata.columns
    .filter((i) => !relations.includes(i.propertyName))
    .map((r) => r.propertyName);

  return {
    field,
    relations,
  } as unknown as ResultGetField<E>;
};

export type PropsArray<E> = { [K in EntityPropsArray<E>]: true };

export const getArrayFields = <E extends Entity>(
  repository: Repository<E>
): PropsArray<E> => {
  const relations = repository.metadata.relations.map((i) => {
    return i.propertyName;
  });

  return repository.metadata.columns
    .filter((i) => !relations.includes(i.propertyName))
    .reduce((acum, metaData) => {
      if (metaData.isArray) {
        acum[metaData.propertyName] = true;
      }
      return acum;
    }, {} as Record<string, boolean>) as PropsArray<E>;
};

export type ArrayPropsForEntity<E extends Entity> = {
  target: PropsArray<E>;
} & {
  [K in ResultGetField<E>['relations'][number]]: PropsArray<
    TypeOfArray<CastProps<E, K>>
  >;
};

export type PropertyTarget<
  E extends Entity,
  For extends PropsNameResultField
> = {
  [K in ResultGetField<E>[For][number]]: K extends keyof E
    ? TypeOfArray<E[K]>
    : never;
};

export const getArrayPropsForEntity = <E extends Entity>(
  repository: Repository<E>
): ArrayPropsForEntity<E> => {
  const connection = repository.metadata.connection;

  const relationsTargets = repository.metadata.relations.reduce(
    (acum, i) => ({
      ...acum,
      [i.propertyName]: i.type,
    }),
    {} as Record<string, string | Function>
  ) as PropertyTarget<E, PropsNameResultField.relations>;

  const { relations } = getField(repository);
  const relationsArrayFields = relations.reduce(
    (acum, item) => {
      guardKeyForPropertyTarget(relationsTargets, item);
      const target = relationsTargets[item] as TypeCast<
        TypeOfArray<CastProps<E, typeof item>>,
        Entity
      >;

      const repository = connection.getRepository(
        target as Function
      ) as Repository<typeof target>;

      acum[item] = getArrayFields(repository) as PropsArray<
        TypeOfArray<CastProps<E, typeof item>>
      >;

      return acum;
    },
    {} as {
      [K in ResultGetField<E>['relations'][number]]: PropsArray<
        TypeOfArray<CastProps<E, K>>
      >;
    }
  );

  return {
    target: getArrayFields(repository),
    ...relationsArrayFields,
  };
};

export const getPropsTreeForRepository = <E extends Entity>(
  repository: Repository<E>
): RelationTree<E> => {
  const dataSource = repository.metadata.connection;

  const relationType = repository.metadata.relations.reduce((acum, i) => {
    acum[i.propertyName] = i.inverseEntityMetadata.target;
    return acum;
  }, {} as Record<string, unknown>) as unknown as RelationType<E>;

  return ObjectTyped.entries(relationType).reduce(
    (acum, [key, value]) => ({
      ...acum,
      ...{ [key]: getField(dataSource.getRepository(value))['field'] },
    }),
    {} as RelationTree<E>
  );
};

export const getIsArrayRelation = <E extends Entity>(
  repository: Repository<E>
): {
  [K in EntityRelation<E>]: E[K] extends unknown[] ? true : false;
} => {
  return repository.metadata.relations.reduce((acum, i) => {
    switch (i.relationType) {
      case 'one-to-many':
      case 'many-to-many':
        acum[i.propertyName] = true;
        break;
      default:
        acum[i.propertyName] = false;
    }
    return acum;
  }, {} as any) as any;
};

export const fromRelationTreeToArrayName = <E extends Entity>(
  relationTree: RelationTree<E>
): ConcatRelation<E> => {
  return ObjectTyped.entries(relationTree).reduce((acum, [name, filed]) => {
    acum.push(...filed.map((i) => `${name.toLocaleString()}.${i}`));
    return acum;
  }, [] as string[]) as unknown as ConcatRelation<E>;
};

export type AllFieldWithTpe<E extends Entity> = FieldWithType<E> & {
  [K in EntityRelation<E>]: E[K] extends (infer U extends Entity)[]
    ? FieldWithType<U>
    : E[K] extends Entity
    ? FieldWithType<E[K]>
    : never;
};

export const getTypeForAllProps = <E extends Entity>(
  repository: Repository<E>
): AllFieldWithTpe<E> => {
  const targetField = getFieldWithType(repository);

  const relationField = repository.metadata.relations.reduce((acum, item) => {
    acum[item.propertyName] = getFieldWithType(
      repository.manager.getRepository(item.inverseEntityMetadata.target)
    );
    return acum;
  }, {} as any);

  return {
    ...targetField,
    ...relationField,
  };
};

export type PropsFieldItem = {
  type: ColumnType;
  isArray: boolean;
  isNullable: boolean;
};

export type PropsForField<E extends Entity> = {
  [K in EntityProps<E>]: PropsFieldItem;
};

export const getPropsFromDb = <E extends Entity>(
  repository: Repository<E>
): PropsForField<E> => {
  return repository.metadata.columns.reduce((acum, i) => {
    acum[i.propertyName as EntityProps<E>] = {
      type: i.type,
      isArray: i.isArray,
      isNullable: i.isNullable,
    };
    return acum;
  }, {} as PropsForField<E>);
};
