import {
  EntityKey,
  EntityMetadata,
  EntityName,
  MetadataStorage,
  ReferenceKind,
} from '@mikro-orm/core';
import { ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { ObjectLiteral, ResultMicroOrmModuleOptions } from '../../../types';
import {
  AllFieldWithType,
  ArrayPropsForEntity,
  FieldWithType,
  PropsArray,
  PropsForField,
  RelationPrimaryColumnType,
  RelationPropsArray,
  RelationPropsTypeName,
  RelationTree,
  ResultGetField,
  TypeField,
  TypeForId,
} from '../../mixin/types';

import { getEntityName } from '../../mixin/helper';

export const getField = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>
): ResultGetField<E> => {
  const relations = entityMetadata.relations.map((i) => i.name);

  const field = entityMetadata.props
    .map((i) => i.name)
    .filter((i) => !relations.includes(i));

  return {
    relations,
    field,
  } as unknown as ResultGetField<E>;
};

export const getPropsTreeForRepository = <E extends ObjectLiteral>(
  metadataStorage: MetadataStorage,
  entity: EntityName<E>
): RelationTree<E> => {
  const entityMetadata = metadataStorage.get(entity);

  const relationType = entityMetadata.relations.reduce((acum, item) => {
    acum[item.name] = item.entity();
    return acum;
  }, {} as Record<EntityKey<E>, EntityName<E>>);

  return ObjectTyped.entries(relationType).reduce(
    (acum, [key, value]) => ({
      ...acum,
      ...{ [key]: getField(metadataStorage.get(value))['field'] },
    }),
    {} as RelationTree<E>
  );
};
export const getArrayPropsForEntity = <E extends ObjectLiteral>(
  metadataStorage: MetadataStorage,
  entity: EntityName<E>,
  config: ResultMicroOrmModuleOptions['options']['arrayType']
): ArrayPropsForEntity<E> => {
  const currentMetadata = metadataStorage.get(entity);

  const relationsArrayFields = currentMetadata.relations.reduce(
    (acum, item) => {
      const entityMetadata = metadataStorage.get(item.entity());
      acum[item.name] = getArrayFields(entityMetadata, config) as any;
      return acum;
    },
    {} as any
  );

  return {
    target: getArrayFields(currentMetadata, config),
    ...relationsArrayFields,
  } as ArrayPropsForEntity<E>;
};

export const getArrayFields = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>,
  config: ResultMicroOrmModuleOptions['options']['arrayType']
): PropsArray<E> => {
  return ObjectTyped.entries(entityMetadata.properties).reduce(
    (acum, [name, val]) => {
      if (config.includes(val['type'])) {
        acum[name] = true;
      }
      return acum;
    },
    {} as Record<EntityKey<E>, boolean>
  ) as unknown as PropsArray<E>;
};

export const getTypeForAllProps = <E extends ObjectLiteral>(
  metadataStorage: MetadataStorage,
  entity: EntityName<E>,
  config: ResultMicroOrmModuleOptions['options']['arrayType']
): AllFieldWithType<E> => {
  const currentMetadata = metadataStorage.get(entity);

  const targetField = getFieldWithType(currentMetadata, config);

  const relationField = currentMetadata.relations.reduce((acum, item) => {
    const entityMetadata = metadataStorage.get(item.entity());
    acum[item.name] = getFieldWithType(entityMetadata, config) as any;
    return acum;
  }, {} as any);

  return {
    ...targetField,
    ...relationField,
  };
};

export const getFieldWithType = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>,
  config: ResultMicroOrmModuleOptions['options']['arrayType']
): FieldWithType<E> => {
  const { field } = getField(entityMetadata);

  const result = {} as any;
  for (const item of field) {
    const props =
      entityMetadata.properties[item as unknown as EntityKey<E, false>];

    let typeProps: TypeField = TypeField.string;
    if (config.includes(props['type'])) {
      result[item] = TypeField.array;
      continue;
    }

    switch (props.runtimeType) {
      case 'Date':
        typeProps = TypeField.date;
        break;
      case 'number':
        typeProps = TypeField.number;
        break;
      case 'boolean':
        typeProps = TypeField.boolean;
        break;
      case 'object':
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
  entityMetadata: EntityMetadata<E>
): RelationPropsArray<E> => {
  const typeArray = [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY];

  const result = {} as any;
  for (const item of entityMetadata.relations) {
    result[item.name] = typeArray.includes(item.kind);
  }
  return result;
};

export const getTypePrimaryColumn = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>
): TypeForId => {
  return entityMetadata.getPrimaryProp().runtimeType === 'number'
    ? TypeField.number
    : TypeField.string;
};

export const getPropsFromDb = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>,
  config: ResultMicroOrmModuleOptions['options']['arrayType']
): PropsForField<E> => {
  return getField(entityMetadata)['field'].reduce((acum, fieldName: any) => {
    // @ts-ignore
    const props = entityMetadata.properties[fieldName];
    const isArray = config.includes(props['type']);
    let type = props.type;
    if (isArray) {
      type = props.columnTypes.at(0).split('[').at(0);
    }

    acum[props.name] = {
      type: type,
      isArray: isArray,
      isNullable: props.nullable || props.default !== undefined,
    };
    return acum;
  }, {} as any) as PropsForField<E>;
};

export const getRelationTypeName = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>
): RelationPropsTypeName<E> => {
  return entityMetadata.relations.reduce((acum, i) => {
    acum[i.name] = getEntityName(i.entity() as any);
    return acum;
  }, {} as Record<string, string>) as RelationPropsTypeName<E>;
};

export const getRelationTypePrimaryColumn = <E extends ObjectLiteral>(
  metadataStorage: MetadataStorage,
  entity: EntityName<E>
): RelationPrimaryColumnType<E> => {
  return metadataStorage.get(entity).relations.reduce((acum, item) => {
    acum[item.name] = getTypePrimaryColumn(metadataStorage.get(item.entity()));

    return acum;
  }, {} as Record<string, TypeField>) as RelationPrimaryColumnType<E>;
};
