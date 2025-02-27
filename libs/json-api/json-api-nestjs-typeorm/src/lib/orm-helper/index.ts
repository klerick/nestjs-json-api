import { EntityParam, TypeField } from '@klerick/json-api-nestjs';
import { Repository } from 'typeorm';

export const getRelation = <E extends object>(repository: Repository<E>) =>
  repository.metadata.relations.map((i) => {
    return i.propertyName;
  }) as unknown as EntityParam<E>['relations'];

export const getProps = <E extends object>(
  repository: Repository<E>
): EntityParam<E>['props'] => {
  const relations = getRelation(repository) as any[];

  return repository.metadata.columns
    .filter((i) => !relations.includes(i.propertyName))
    .map((r) => r.propertyName) as unknown as EntityParam<E>['props'];
};

export const getPropsType = <E extends object>(
  repository: Repository<E>
): EntityParam<E>['propsType'] => {
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

    switch (
      Reflect.getMetadata('design:type', entity['prototype'], item as any)
    ) {
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

export const getPropsNullable = <E extends object>(
  repository: Repository<E>
): EntityParam<E>['propsNullable'] => {
  const relation = getRelation(repository) as any[];
  return repository.metadata.columns
    .filter((i) => !relation.includes(i.propertyName))
    .map((i) =>
      i.isNullable || i.default !== undefined ? i.propertyName : false
    )
    .filter((i) => !!i) as unknown as EntityParam<E>['propsNullable'];
};

export const getPrimaryColumnName = <E extends object>(
  repository: Repository<E>
) => {
  const column = repository.metadata.primaryColumns.at(0);
  if (!column) throw new Error('Primary column not found');

  return column.propertyName as EntityParam<E>['primaryColumnName'];
};

export const getPrimaryColumnType = <E extends object>(
  repository: Repository<E>
): EntityParam<E>['primaryColumnType'] => {
  const target = repository.target as any;
  const primaryColumn = repository.metadata.primaryColumns[0].propertyName;

  return (
    Reflect.getMetadata('design:type', target['prototype'], primaryColumn) ===
    Number
      ? TypeField.number
      : TypeField.string
  ) as EntityParam<E>['primaryColumnType'];
};

export const getRelationProperty = <E extends object>(
  repository: Repository<E>
): EntityParam<E>['relationProperty'] => {
  return repository.metadata.relations.reduce((acum, item) => {
    // @ts-expect-error its dynamic creater
    acum[item.propertyName] = {
      entityClass: item.inverseEntityMetadata.target,
      nullable: item.isManyToMany || item.isOneToMany ? false : item.isNullable,
      isArray: item.isManyToMany || item.isOneToMany,
    };

    return acum;
  }, {} as EntityParam<E>['relationProperty']);
};

export const getArrayType = <E extends object>(
  repository: Repository<E>
): EntityParam<E>['propsArrayType'] => {
  return Object.entries(getPropsType(repository))
    .filter(([name, type]) => type === TypeField.array)
    .reduce((acum, [name]) => {
      const fieldMetadata = repository.metadata.columns.find(
        (i) => i.propertyName === name
      );
      if (!fieldMetadata) {
        throw new Error('Metadata not found for field ' + name);
      }

      switch (fieldMetadata.type) {
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
