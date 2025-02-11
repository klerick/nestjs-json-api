import {
  EntityProps,
  EntityRelation,
  ObjectTyped,
} from '@klerick/json-api-nestjs-shared';
import { Repository } from 'typeorm';

import { ObjectLiteral, ResultMicroOrmModuleOptions } from '../../../types';
import {
  RelationTree,
  ValueOf,
  UnionToTuple,
  TypeCast,
  Concat,
  TypeOfArray,
  CastProps,
  PropsNameResultField,
  PropsArray,
  RelationType,
  ResultGetField,
  ArrayPropsForEntity,
  AllFieldWithType,
  TypeField,
  FieldWithType,
  RelationPropsArray,
  TypeForId,
  PropsForField,
  ColumnType,
  RelationPropsTypeName,
  RelationPrimaryColumnType,
  TupleOfEntityRelation,
  TupleOfEntityProps,
  FilterNullableProps,
  RelationProperty,
} from '../../mixin/types';
import { getEntityName } from '../../mixin/helper';
import { EntityMetadata } from '@mikro-orm/core';

export type ConcatFieldWithRelation<
  R extends string,
  T extends readonly string[]
> = ValueOf<{
  [K in T[number]]: Concat<R, K>;
}>;

export type ConcatRelationUnion<
  E extends ObjectLiteral,
  R = RelationTree<E>
> = ValueOf<{
  [K in keyof R]: ConcatFieldWithRelation<
    TypeCast<K, string>,
    TypeCast<R[K], readonly string[]>
  >;
}>;

export type ConcatRelation<E extends ObjectLiteral> = TypeCast<
  UnionToTuple<ConcatRelationUnion<E>>,
  [string, ...string[]]
>;

export const getField = <E extends ObjectLiteral>(
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

export const fromRelationTreeToArrayName = <E extends ObjectLiteral>(
  relationTree: RelationTree<E>
): ConcatRelation<E> => {
  return ObjectTyped.entries(relationTree).reduce((acum, [name, filed]) => {
    acum.push(...filed.map((i) => `${name.toLocaleString()}.${i}`));
    return acum;
  }, [] as string[]) as unknown as ConcatRelation<E>;
};

export const getPropsTreeForRepository = <E extends ObjectLiteral>(
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

export type PropertyTarget<
  E extends ObjectLiteral,
  For extends PropsNameResultField
> = {
  [K in ResultGetField<E>[For][number]]: K extends keyof E
    ? TypeOfArray<E[K]>
    : never;
};

export function guardKeyForPropertyTarget<
  E extends ObjectLiteral,
  For extends PropsNameResultField,
  R extends PropertyTarget<E, For>
>(relationsTargets: R, key: any): asserts key is keyof R {
  if (!(key in relationsTargets)) throw new Error('Type guard error');
}

export const getArrayPropsForEntity = <E extends ObjectLiteral>(
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
        ObjectLiteral
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

export const getArrayFields = <E extends ObjectLiteral>(
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

export const getTypeForAllProps = <E extends ObjectLiteral>(
  repository: Repository<E>
): AllFieldWithType<E> => {
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

export const getFieldWithType = <E extends ObjectLiteral>(
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

export const getRelationTypeArray = <E extends ObjectLiteral>(
  repository: Repository<E>
): RelationPropsArray<E> => {
  const { relations } = getField(repository);

  const entity = repository.target as any;
  const result = {} as any;
  for (const item of relations) {
    result[item] =
      Reflect.getMetadata('design:type', entity['prototype'], item) === Array;
  }
  return result;
};

export const getTypePrimaryColumn = <E extends ObjectLiteral>(
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

export const getPropsFromDb = <E extends ObjectLiteral>(
  repository: Repository<E>
): PropsForField<E> => {
  return repository.metadata.columns.reduce((acum, i) => {
    const tmp = i.propertyName as unknown as EntityProps<E> & EntityRelation<E>;
    acum[tmp] = {
      type: i.type as ColumnType,
      isArray: i.isArray,
      isNullable: i.isNullable || i.default !== undefined,
    };
    return acum;
  }, {} as PropsForField<E>);
};

export const getRelationTypeName = <E extends ObjectLiteral>(
  repository: Repository<E>
): RelationPropsTypeName<E> => {
  return repository.metadata.relations.reduce((acum, i) => {
    acum[i.propertyName] = getEntityName(i.inverseEntityMetadata.target);
    return acum;
  }, {} as Record<string, string>) as RelationPropsTypeName<E>;
};

export const getRelationTypePrimaryColumn = <E extends ObjectLiteral>(
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
// -----

export const getRelation = <E extends ObjectLiteral>(
  repository: Repository<E>
) =>
  repository.metadata.relations.map((i) => {
    return i.propertyName;
  }) as TupleOfEntityRelation<E>;

export const getProps = <E extends ObjectLiteral>(
  repository: Repository<E>
): TupleOfEntityProps<E> => {
  const relations = getRelation(repository);

  return repository.metadata.columns
    .filter((i) => !relations.includes(i.propertyName))
    .map((r) => r.propertyName) as TupleOfEntityProps<E>;
};

export const getPropsType = <E extends ObjectLiteral>(
  repository: Repository<E>
): FieldWithType<E> => {
  const field = getProps(repository);

  const entity = repository.target as any;
  const result = {} as any;
  for (const item of field) {
    let typeProps: TypeField = TypeField.string;

    const fieldMetadata = repository.metadata.columns.find(
      (i) => i.propertyName === item
    );

    if (fieldMetadata?.isArray) {
      result[item] = TypeField.array;
      continue;
    }

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

    result[item] = fieldMetadata?.isArray ? TypeField.array : typeProps;
  }

  return result;
};

export const getPropsNullable = <E extends ObjectLiteral>(
  repository: Repository<E>
): FilterNullableProps<E, TupleOfEntityProps<E>> => {
  const relation = getRelation(repository);
  return repository.metadata.columns
    .filter((i) => !relation.includes(i.propertyName))
    .map((i) =>
      i.isNullable || i.default !== undefined ? i.propertyName : false
    )
    .filter((i) => !!i) as FilterNullableProps<E, TupleOfEntityProps<E>>;
};

export const getPrimaryColumnName = <E extends ObjectLiteral>(
  repository: Repository<E>
) => {
  const column = repository.metadata.primaryColumns.at(0);
  if (!column) throw new Error('Primary column not found');

  return column.propertyName;
};

export const getPrimaryColumnType = <E extends ObjectLiteral>(
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

export const getRelationProperty = <E extends ObjectLiteral>(
  repository: Repository<E>
): RelationProperty<E> => {
  return repository.metadata.relations.reduce((acum, item) => {
    // @ts-expect-error its dynamic creater
    acum[item.propertyName] = {
      entityClass: item.inverseEntityMetadata.target,
      nullable: item.isManyToMany || item.isOneToMany ? false : item.isNullable,
      isArray: item.isManyToMany || item.isOneToMany,
    };

    return acum;
  }, {} as RelationProperty<E>);
};
