import {
  EntityMetadata,
  Equal,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';

import {
  Filter,
  FilterOperand,
  ServiceOptions,
  ValidationError,
} from '../../../../types';
import { snakeToCamel, getEntityName, camelToKebab } from '../../../../helper';
import {
  OperandMapForNull,
  OperandMapForNullRelation,
  OperandsMap,
} from '../../../../types-common';
import { ResourceRequestObject } from '../../../../types-common/request';
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

export type ResultQueryExpression = {
  expression: string;
  params: { name: string; val: string } | null;
  selectInclude?: string;
};

export class UtilsMethode {
  public static relationNameMapByEntity: Map<string, Set<string>> = new Map();

  public static getParamName(field: string, i: number) {
    return `params_${field}_${i}`;
  }

  public static applyQueryFiltersTarget<T>(
    builder: SelectQueryBuilder<T>,
    filter: Filter<T>['target'],
    metadata: EntityMetadata
  ): ResultQueryExpression[] {
    const resultExpression: ResultQueryExpression[] = [];
    const preparedResourceName = snakeToCamel(metadata.name);

    if (!UtilsMethode.relationNameMapByEntity.has(preparedResourceName)) {
      UtilsMethode.relationNameMapByEntity.set(
        preparedResourceName,
        new Set(metadata.relations.map((item) => item.propertyName))
      );
    }

    const relations =
      UtilsMethode.relationNameMapByEntity.get(preparedResourceName);

    let field: keyof Filter<T>['target'];
    let i = 0;

    for (field in filter) {
      const operand = Object.keys(filter[field]).pop();
      const value =
        operand === FilterOperand.like
          ? `%${filter[field][operand]}%`
          : filter[field][operand];

      if (relations.has(field)) {
        const relation = metadata.relations.find(
          (item) => item.propertyName === field
        );
        const {
          inverseSidePropertyPath,
          inverseEntityMetadata: { target, name },
        } = relation;
        const resourceRelationName = snakeToCamel(name);
        const primaryColumn = metadata.primaryColumns[0].databaseName;
        switch (relation.relationType) {
          case 'many-to-many': {
            const { inverseJoinColumns, joinColumns } =
              relation.isManyToManyOwner ? relation : relation.inverseRelation;
            const relationProps = relation.isManyToManyOwner
              ? relation
              : relation.inverseRelation;
            const { joinTableName } = relationProps;
            const { databaseName: queryJoinPropsName } =
              relation.isManyToManyOwner
                ? inverseJoinColumns[0]
                : joinColumns[0];
            const { databaseName: selectJoinPropsName } =
              relation.isManyToManyOwner
                ? joinColumns[0]
                : inverseJoinColumns[0];
            const onQuery = `${joinTableName}.${queryJoinPropsName} = ${resourceRelationName}.${primaryColumn}`;
            const selectQuery = `${joinTableName}.${selectJoinPropsName}`;

            const query = builder
              .subQuery()
              .select(selectQuery)
              .from(joinTableName, joinTableName)
              .leftJoin(resourceRelationName, resourceRelationName, onQuery)
              .where(`${selectQuery} = ${metadata.tableName}.${primaryColumn}`)
              .getQuery();
            resultExpression.push({
              expression: OperandMapForNullRelation[operand].replace(
                'EXPRESSION',
                query
              ),
              params: null,
            });
            break;
          }
          case 'one-to-many': {
            const query = builder
              .subQuery()
              .select(`${resourceRelationName}.${inverseSidePropertyPath}`)
              .from(target, resourceRelationName)
              .where(
                `${resourceRelationName}.${inverseSidePropertyPath} = ${metadata.tableName}.id`
              )
              .getQuery();
            resultExpression.push({
              expression: OperandMapForNullRelation[operand].replace(
                'EXPRESSION',
                query
              ),
              params: null,
            });
            break;
          }
          default: {
            resultExpression.push({
              expression: `${preparedResourceName}.${field.toString()} ${OperandMapForNull[
                operand
              ].replace(
                'EXPRESSION',
                UtilsMethode.getParamName(`${preparedResourceName}.${field}`, i)
              )}`,
              params: null,
            });
          }
        }
      } else {
        resultExpression.push({
          expression: `${preparedResourceName}.${field.toString()} ${OperandsMap[
            operand
          ].replace(
            'EXPRESSION',
            UtilsMethode.getParamName(`${preparedResourceName}.${field}`, i)
          )}`,
          params: {
            name: UtilsMethode.getParamName(
              `${preparedResourceName}.${field}`,
              i
            ),
            val: value,
          },
        });
      }
      i++;
    }

    return resultExpression;
  }

  public static applyQueryFilterRelation<T>(
    builder: SelectQueryBuilder<T>,
    filter: Filter<T>['relation'],
    metadata: EntityMetadata
  ): ResultQueryExpression[] {
    const resultExpression: ResultQueryExpression[] = [];
    const preparedResourceName = snakeToCamel(metadata.name);
    const primaryColumn = metadata.primaryColumns[0].databaseName;
    let relationProperty: keyof Filter<T>['relation'];
    let i = 0;
    for (relationProperty in filter) {
      if (!filter[relationProperty]) {
        continue;
      }

      const relation = metadata.relations.find((item) => {
        return item.propertyName === relationProperty;
      });
      const {
        inverseSidePropertyPath,
        inverseEntityMetadata: { target, name },
      } = relation;
      const resourceName = snakeToCamel(name);
      let relationFieldProperty: keyof Filter<T>['relation'][typeof relationProperty];
      for (relationFieldProperty in filter[relationProperty]) {
        const operand = Object.keys(
          filter[relationProperty][relationFieldProperty]
        ).pop();
        const value =
          operand === FilterOperand.like
            ? `%${filter[relationProperty][relationFieldProperty][operand]}%`
            : filter[relationProperty][relationFieldProperty][operand];

        const currentOperandMap =
          value.toString().toLocaleLowerCase() === 'null'
            ? OperandMapForNull
            : OperandsMap;
        const paramsField =
          value.toString().toLocaleLowerCase() === 'null'
            ? null
            : UtilsMethode.getParamName(
                `${relationProperty}.${relationFieldProperty.toString()}`,
                i
              );
        switch (relation.relationType) {
          case 'many-to-many': {
            const { inverseJoinColumns, joinColumns } =
              relation.isManyToManyOwner ? relation : relation.inverseRelation;
            const relationProps = relation.isManyToManyOwner
              ? relation
              : relation.inverseRelation;
            const { joinTableName } = relationProps;
            const { databaseName: queryJoinPropsName } =
              relation.isManyToManyOwner
                ? inverseJoinColumns[0]
                : joinColumns[0];
            const { databaseName: selectJoinPropsName } =
              relation.isManyToManyOwner
                ? joinColumns[0]
                : inverseJoinColumns[0];
            const onQuery = `${joinTableName}.${queryJoinPropsName} = ${resourceName}.${primaryColumn}`;
            const selectQuery = `${joinTableName}.${selectJoinPropsName}`;

            const query = builder
              .subQuery()
              .select(selectQuery)
              .from(joinTableName, joinTableName)
              .leftJoin(resourceName, relationProperty, onQuery)
              .where(
                `${relationProperty}.${relationFieldProperty.toString()} ${currentOperandMap[
                  operand
                ].replace('EXPRESSION', paramsField)}`
              )
              .getQuery();
            resultExpression.push({
              expression: `${preparedResourceName}.id IN ${query}`,
              params:
                paramsField === null
                  ? null
                  : {
                      val: value,
                      name: paramsField,
                    },
            });

            break;
          }
          case 'one-to-many': {
            const query = builder
              .subQuery()
              .select(`${resourceName}.${inverseSidePropertyPath}`)
              .from(target, resourceName)
              .where(
                `${resourceName}.${relationFieldProperty.toString()} ${currentOperandMap[
                  operand
                ].replace('EXPRESSION', paramsField)}`
              )
              .getQuery();

            resultExpression.push({
              expression: `${preparedResourceName}.id IN ${query}`,
              params:
                paramsField === null
                  ? null
                  : {
                      val: value,
                      name: paramsField,
                    },
            });
            break;
          }
          default:
            resultExpression.push({
              expression: `${relationProperty}.${relationFieldProperty.toString()} ${currentOperandMap[
                operand
              ].replace('EXPRESSION', paramsField)}`,
              params:
                paramsField === null
                  ? null
                  : {
                      val: value,
                      name: paramsField,
                    },
              selectInclude: relationProperty,
            });
            break;
        }

        i++;
      }
    }
    return resultExpression;
  }

  public static async *asyncIterateFindRelationships<T>(
    relationships: ResourceRequestObject<T>['data']['relationships'],
    repository: Repository<T>
  ): AsyncIterable<{
    propsName: string;
    type: string;
    rel: ObjectLiteral | ObjectLiteral[];
    id: string | string[];
  }> {
    const relationsKeys = Object.keys(relationships);
    const countRelationsKeys = relationsKeys.length;
    const preparedResourceName = snakeToCamel(repository.metadata.name);
    if (!UtilsMethode.relationNameMapByEntity.has(preparedResourceName)) {
      UtilsMethode.relationNameMapByEntity.set(
        preparedResourceName,
        new Set(repository.metadata.relations.map((item) => item.propertyName))
      );
    }

    const relations =
      UtilsMethode.relationNameMapByEntity.get(preparedResourceName);

    let i = 0;
    while (countRelationsKeys > i) {
      const relationsName = relationsKeys[i];
      if (!relations.has(relationsKeys[i])) {
        throw new NotFoundException({
          detail: `Resource for props '${relationsName}' does not exist`,
        });
      }
      const { data } = relationships[relationsName];
      if (data === null) {
        yield { propsName: relationsName, type: null, rel: null, id: null };
        i++;
        continue;
      }
      const isArray = Array.isArray(data);
      if (isArray && data.length === 0) {
        yield { propsName: relationsName, type: null, rel: [], id: null };
        i++;
        continue;
      }

      const condition = isArray ? In(data.map((i) => i.id)) : Equal(data['id']);

      const relationsTypeName = isArray ? data[0]['type'] : data['type'];

      const result = await repository.manager
        .getRepository(relationsTypeName)
        .find({
          select: {
            id: true,
          },
          where: {
            id: condition,
          },
        });

      const relData = !isArray ? [data] : data;
      const idsToAdd = relData.map((i) => i.id);

      if (
        (isArray &&
          (result.length === 0 || result.length !== idsToAdd.length)) ||
        (!isArray && result.length === 0)
      ) {
        const detail = isArray
          ? `Resource '${relationsTypeName}' with ids '${idsToAdd.join(
              ','
            )}' does not exist`
          : `Resource '${relationsTypeName}' with id '${idsToAdd[0]}' does not exist`;
        throw new NotFoundException({
          detail,
        });
      }

      const { type } = relData[0];
      yield {
        propsName: relationsName,
        type,
        rel: isArray ? result : result[0],
        id: isArray ? idsToAdd : idsToAdd[0],
      };
      i++;
    }
  }

  public static async validateRelationRequestData<T>(
    repository: Repository<T>,
    id: number,
    relName: string,
    body: ServiceOptions<T>['body']
  ): Promise<{
    item: T;
    rel: ObjectLiteral | ObjectLiteral[];
    relationItem: RelationMetadata;
  }> {
    const relationItem = repository.metadata.relations.find(
      (i) => i.propertyName === relName
    );

    const typeName = camelToKebab(
      getEntityName(relationItem.inverseEntityMetadata.target)
    );

    const isArray = Array.isArray(body);

    if (
      ['one-to-many', 'many-to-many'].includes(relationItem.relationType) &&
      !isArray
    ) {
      throw new UnprocessableEntityException([
        {
          source: {
            parameter: '/data',
          },
          detail: `Body data should be array`,
        },
      ]);
    }

    if (
      ['one-to-one', 'many-to-one'].includes(relationItem.relationType) &&
      isArray
    ) {
      throw new UnprocessableEntityException([
        {
          source: {
            parameter: '/data',
          },
          detail: `Body data should be object`,
        },
      ]);
    }

    const findOneOptions = {
      select: {
        [repository.metadata.primaryColumns[0].propertyName]: true,
      },
      where: {
        id: Equal(id),
      },
    } as unknown as FindOneOptions<T>;
    const item = await repository.findOne(findOneOptions);
    if (!item) {
      throw new NotFoundException([
        {
          detail: `Not exist item "${id}" in resource "${camelToKebab(
            getEntityName(repository.target)
          )}"`,
        },
      ]);
    }

    if (body === null || (isArray && body.length === 0)) {
      return {
        item,
        rel: isArray ? [] : null,
        relationItem,
      };
    }

    const prepareData = isArray ? body : [body];
    const errors: ValidationError[] = [];
    for (const prepareItem in prepareData) {
      if (prepareData[prepareItem]['type'] !== typeName) {
        errors.push({
          source: {
            parameter: isArray ? `/data/${prepareItem}` : '/data',
          },
          detail: `Type should be equal type of relName: "${relName}". Type of "${relName}" is ${typeName}`,
        });
      }
    }

    if (errors.length) {
      throw new UnprocessableEntityException(errors);
    }
    const relIds = prepareData.map((i) => i.id);
    const relData = await repository.manager
      .getRepository(relationItem.inverseEntityMetadata.target)
      .find({
        select: {
          [relationItem.inverseEntityMetadata.primaryColumns[0].propertyName]:
            true,
        },
        where: {
          id: In(relIds),
        },
      });

    if (relData.length !== prepareData.length) {
      const mapRelData = relData.reduce<Record<string, boolean>>(
        (acum, item) => {
          acum[item.id] = true;
          return acum;
        },
        {}
      );
      throw new NotFoundException(
        relIds
          .filter((id) => !mapRelData[id])
          .map((id) => ({
            detail: `Not exist item "${id}" in relation "${relName}"`,
          }))
      );
    }

    return {
      item,
      rel: isArray ? relData : relData[0],
      relationItem,
    };
  }
}
