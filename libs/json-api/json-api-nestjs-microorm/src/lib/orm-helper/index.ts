import { EntityKey, EntityMetadata } from '@mikro-orm/core';
import {
  EntityParam,
  TypeField,
  PrepareParams,
} from '@klerick/json-api-nestjs';
import { MicroOrmParam } from '../type';
import { DEFAULT_ARRAY_TYPE } from '../constants';

export const getRelation = <E extends object>(
  entityMetadata: EntityMetadata<E>
) =>
  entityMetadata.relations.map(
    (i) => i.name
  ) as unknown as EntityParam<E>['relations'];

export const getProps = <E extends object>(
  entityMetadata: EntityMetadata<E>
): EntityParam<E>['props'] => {
  const relations = getRelation(entityMetadata) as any;

  return entityMetadata.props
    .map((i) => i.name)
    .filter(
      (i) => !relations.includes(i)
    ) as unknown as EntityParam<E>['props'];
};

export const getPropsType = <E extends object>(
  entityMetadata: EntityMetadata<E>,
  config: PrepareParams<MicroOrmParam>['options']['arrayType'] = DEFAULT_ARRAY_TYPE
): EntityParam<E>['propsType'] => {
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

export const getPropsNullable = <E extends object>(
  entityMetadata: EntityMetadata<E>
): EntityParam<E>['propsNullable'] => {
  return getProps(entityMetadata)
    .map((i) => {
      // @ts-ignore
      const props = entityMetadata.properties[i];
      return props.nullable ||
        props.default !== undefined ||
        props.defaultRaw !== undefined
        ? i
        : false;
    })
    .filter((i) => !!i) as unknown as EntityParam<E>['propsNullable'];
};

export const getPrimaryColumnName = <E extends object>(
  entityMetadata: EntityMetadata<E>
) =>
  entityMetadata
    .getPrimaryProp()
    .name.toString() as EntityParam<E>['primaryColumnName'];

export const getPrimaryColumnType = <E extends object>(
  entityMetadata: EntityMetadata<E>
): EntityParam<E>['primaryColumnType'] => {
  return (
    entityMetadata.getPrimaryProp().runtimeType === 'number'
      ? TypeField.number
      : TypeField.string
  ) as EntityParam<E>['primaryColumnType'];
};

export const getRelationProperty = <E extends object>(
  entityMetadata: EntityMetadata<E>
): EntityParam<E>['relationProperty'] => {
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
  }, {} as EntityParam<E>['relationProperty']);
};

export const getArrayType = <E extends object>(
  repository: EntityMetadata<E>,
  config: PrepareParams<MicroOrmParam>['options']['arrayType'] = DEFAULT_ARRAY_TYPE
): EntityParam<E>['propsArrayType'] => {
  return Object.entries(getPropsType(repository, config))
    .filter(([name, type]) => type === TypeField.array)
    .reduce((acum, [name]) => {
      const fieldType = Reflect.get(repository.properties, name)
        .columnTypes.at(0)
        ?.replace('[]', '');

      if (!fieldType) {
        throw new Error('Metadata not found for field ' + name);
      }

      switch (fieldType) {
        case 'number':
        case 'bigint':
        case 'smallint':
        case 'smalldecimal':
        case 'decimal':
        case 'double':
        case 'tinyint':
        case 'mediumint':
        case 'int':
        case 'float':
        case 'dec':
        case 'fixed':
        case 'numeric':
        case 'real':
        case 'int2':
        case 'int4':
        case 'int8':
        case 'integer':
          acum[name] = TypeField.number;
          break;
        case 'character varying':
        case 'varying character':
        case 'char varying':
        case 'nvarchar':
        case 'national varchar':
        case 'character':
        case 'native character':
        case 'varchar':
        case 'char':
        case 'nchar':
        case 'national char':
        case 'varchar2':
        case 'nvarchar2':
        case 'alphanum':
        case 'shorttext':
        case 'raw':
        case 'binary':
        case 'varbinary':
        case 'string':
          acum[name] = TypeField.string;
          break;
        case 'date':
        case 'timetz':
        case 'timestamptz':
        case 'timestamp with local time zone':
        case 'smalldatetime':
          acum[name] = TypeField.date;
          break;
        case 'boolean':
          acum[name] = TypeField.boolean;
      }

      return acum;
    }, {} as any);
};
