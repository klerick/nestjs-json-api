import { EntityKey, EntityMetadata } from '@mikro-orm/core';
import { ObjectLiteral, ResultMicroOrmModuleOptions } from '../../../types';
import {
  FieldWithType,
  FilterNullableProps,
  RelationProperty,
  TupleOfEntityProps,
  TupleOfEntityRelation,
  TypeField,
  TypeForId,
} from '../../mixin/types';

export const getRelation = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>
) => entityMetadata.relations.map((i) => i.name) as TupleOfEntityRelation<E>;

export const getProps = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>
): TupleOfEntityProps<E> => {
  const relations = getRelation(entityMetadata);

  return entityMetadata.props
    .map((i) => i.name)
    .filter((i) => !relations.includes(i)) as TupleOfEntityProps<E>;
};

export const getPropsType = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>,
  config: ResultMicroOrmModuleOptions['options']['arrayType']
): FieldWithType<E> => {
  const field = getProps(entityMetadata);

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

export const getPropsNullable = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>
): FilterNullableProps<E, TupleOfEntityProps<E>> => {
  return getProps(entityMetadata)
    .map((i) => {
      // @ts-ignore
      const props = entityMetadata.properties[i];
      return props.nullable || props.default !== undefined ? i : false;
    })
    .filter((i) => !!i) as FilterNullableProps<E, TupleOfEntityProps<E>>;
};

export const getPrimaryColumnName = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>
) => entityMetadata.getPrimaryProp().name.toString();

export const getPrimaryColumnType = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>
): TypeForId => {
  return entityMetadata.getPrimaryProp().runtimeType === 'number'
    ? TypeField.number
    : TypeField.string;
};

export const getRelationProperty = <E extends ObjectLiteral>(
  entityMetadata: EntityMetadata<E>
): RelationProperty<E> => {
  return entityMetadata.relations.reduce((acum, item) => {
    // @ts-expect-error its dynamic creater
    acum[item.name] = {
      entityClass: item.entity() as any,
      nullable:
        item.kind === 'm:n' || item.kind === '1:m'
          ? false
          : (!!item.nullable as any),
      isArray: item.kind === 'm:n' || item.kind === ('1:m' as any),
    };

    return acum;
  }, {} as RelationProperty<E>);
};
