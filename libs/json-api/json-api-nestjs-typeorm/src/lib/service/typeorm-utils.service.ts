import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EntityMetadata, Equal, In, Repository } from 'typeorm';
import { RelationMetadata as TypeOrmRelationMetadata } from 'typeorm/metadata/RelationMetadata';
import {
  ObjectTyped,
  FilterOperand,
  getEntityName,
  RelationKeys,
} from '@klerick/json-api-nestjs-shared';

import {
  ValidateQueryError,
  PatchData,
  PostData,
  Query,
  UnionToTuple,
} from '@klerick/json-api-nestjs';
import { kebabCase, camelCase, pascalCase } from 'change-case-commonjs';
import { titleCase } from 'typeorm/util/StringUtils';
import {
  EXPRESSION,
  OperandMapExpressionForNull,
  OperandsMapExpression,
  OperandsMapExpressionForNullRelation,
} from '../type';

import { CURRENT_ENTITY_REPOSITORY } from '../constants';

type RelationAlias<E> = {
  [K in UnionToTuple<RelationKeys<E>>[number] & PropertyKey]: string;
};
type RelationMetadata<E> = {
  [K in UnionToTuple<RelationKeys<E>>[number] &
    PropertyKey]: TypeOrmRelationMetadata;
};

type ResultQueryExpressionObject = { name: string; val: string };
type ResultQueryExpressionArray = { name: string; val: string }[];

export type RelationshipsResult<E extends object, IdKey extends string> = {
  [K in RelationKeys<E, IdKey>]: E[K] extends E[K][] ? E[K] : E[K] | null;
};

export type ResultQueryExpression = {
  alias?: string;
  expression: string;
  paramsForResult?: string[];
  params?: ResultQueryExpressionObject | ResultQueryExpressionArray;
  selectInclude?: string;
};
export type InputValidateData = {
  type: string;
  id: string;
};

export type ValidateReturn<T> = T extends unknown[]
  ? string[]
  : T extends null
  ? null
  : string;

function isTargetField<E extends object>(
  relationField: UnionToTuple<RelationKeys<E>>,
  field: any
): field is UnionToTuple<RelationKeys<E>>[number] {
  return (relationField as any[]).includes(field);
}

function isRelationField<E extends object>(
  relationField: UnionToTuple<RelationKeys<E>>,
  field: any
): asserts field is RelationKeys<E> {
  if (isTargetField(relationField, field)) return;
  const error: ValidateQueryError = {
    code: 'unrecognized_keys',
    path: ['data', 'relationships'],
    message: `Resource for relation '${field.toString()}' does not exist`,
    keys: [field],
  };

  throw new BadRequestException([error]);
}

Injectable();
export class TypeormUtilsService<
  E extends object,
  IdKey extends string = 'id'
> {
  private readonly _currentAlias!: string;
  private readonly _relationMetadata = {} as RelationMetadata<E>;
  private readonly _relationAlias = {} as RelationAlias<E>;
  private readonly _relationFields!: UnionToTuple<RelationKeys<E>>;
  private readonly _entityMetadata!: EntityMetadata;
  private _number = 0;

  constructor(
    @Inject(CURRENT_ENTITY_REPOSITORY) private repository: Repository<E>
  ) {
    this._currentAlias = pascalCase(repository.metadata.name);
    const relationFields = [];
    for (const metadata of repository.metadata.relations) {
      const propertyName = metadata.propertyName as UnionToTuple<
        RelationKeys<E>
      >[number];

      Reflect.set(this._relationMetadata, propertyName as any, metadata);
      Reflect.set(
        this._relationAlias,
        propertyName as any,
        titleCase(metadata.inverseEntityMetadata.name)
      );

      relationFields.push(propertyName);
    }
    this._relationFields = relationFields as UnionToTuple<RelationKeys<E>>;
    this._entityMetadata = repository.metadata;
  }
  get currentAlias() {
    return this._currentAlias;
  }

  get relationFields(): UnionToTuple<RelationKeys<E>> {
    return this._relationFields;
  }

  relationName(relName: keyof RelationAlias<E>) {
    return this._relationAlias[relName];
  }

  get currentPrimaryColumn(): keyof E {
    return this._entityMetadata.primaryColumns[0].propertyName as keyof E;
  }

  getAliasForRelation(relName: keyof RelationAlias<E>) {
    return `${this.currentAlias}__${this._relationAlias[relName]}_${String(
      relName
    )}`;
  }

  getRelMetaDataForRelation(relName: keyof RelationAlias<E>) {
    return this._relationMetadata[relName];
  }

  getPrimaryColumnForRel(relName: keyof RelationAlias<E>) {
    return this._relationMetadata[relName].inverseEntityMetadata
      .primaryColumns[0].propertyName;
  }

  private getFilterObject(
    query: Query<E, IdKey>,
    filterType: 'target' | 'relation'
  ) {
    const { filter } = query as any;
    if (!filter) return null;
    return filter[filterType];
  }

  private get number() {
    if (this._number > 1000) {
      this._number = 0;
    }
    this._number++;
    return this._number;
  }

  private getParamName(fieldName: string) {
    return `params_${fieldName}_${this.number}`;
  }

  getAliasPath(fieldName: unknown): string;
  getAliasPath(
    fieldName: unknown,
    relname: keyof RelationAlias<E>,
    separator?: string
  ): string;
  getAliasPath(fieldName: unknown, relname: string, separator?: string): string;
  getAliasPath(
    fieldName: unknown,
    relname?: keyof RelationAlias<E> | string,
    separator = '.'
  ): string {
    const alias = relname
      ? Reflect.get(this._relationAlias, relname) || relname
      : this.currentAlias;
    return `${String(alias)}${separator}${fieldName}`;
  }

  private getSubQueryForManyToMany(
    fieldName: keyof RelationMetadata<E> | keyof RelationAlias<E>,
    expression?: string[]
  ): string {
    const metadataRelation: TypeOrmRelationMetadata =
      this._relationMetadata[fieldName];
    const relationPrimaryColumn =
      metadataRelation.inverseEntityMetadata.primaryColumns[0].propertyName;
    const { joinTableName, inverseJoinColumns, joinColumns } =
      metadataRelation.isManyToManyOwner
        ? metadataRelation
        : metadataRelation.inverseRelation || metadataRelation;

    const { databaseName: queryJoinPropsName } =
      metadataRelation.isManyToManyOwner
        ? inverseJoinColumns[0]
        : joinColumns[0];
    const { databaseName: selectJoinPropsName } =
      metadataRelation.isManyToManyOwner
        ? joinColumns[0]
        : inverseJoinColumns[0];

    const alias = this.getAliasPath(
      this._relationAlias[fieldName],
      this.currentAlias,
      '-'
    );

    const selectAlias = this.getAliasPath(selectJoinPropsName, alias);

    const query = this.repository
      .createQueryBuilder()
      .subQuery()
      .select(selectAlias)
      .from(joinTableName, alias)
      .leftJoin(
        this._relationMetadata[fieldName].inverseEntityMetadata.target,
        this.getAliasForRelation(fieldName),
        `${this.getAliasPath(queryJoinPropsName, alias)} = ${this.getAliasPath(
          relationPrimaryColumn,
          this.getAliasForRelation(fieldName)
        )}`
      );
    if (!expression) {
      query.where(
        `${selectAlias} = ${this.getAliasPath(this.currentPrimaryColumn)}`
      );
    } else {
      for (const i in expression) {
        query[i === '0' ? 'where' : 'andWhere'](expression[i]);
      }
    }
    return query.getQuery();
  }

  getFilterExpressionForTarget(
    query: Query<E, IdKey>
  ): ResultQueryExpression[] {
    const resultExpression: ResultQueryExpression[] = [];
    const filterTarget = this.getFilterObject(query, 'target');
    if (!filterTarget) return resultExpression;
    for (const [fieldName, filter] of ObjectTyped.entries(filterTarget)) {
      if (!filter) continue;
      for (const entries of ObjectTyped.entries(filter)) {
        const [operand, value] = entries as [FilterOperand, string];
        const valueConditional =
          operand === FilterOperand.like ? `%${value}%` : value;
        const fieldWithAlias = this.getAliasPath(fieldName);
        const paramsName = this.getParamName(fieldWithAlias);

        if (!isTargetField(this._relationFields, fieldName)) {
          if (
            (operand === FilterOperand.ne || operand === FilterOperand.eq) &&
            (valueConditional === 'null' || valueConditional === null)
          ) {
            const expression = OperandMapExpressionForNull[operand].replace(
              EXPRESSION,
              paramsName
            );
            resultExpression.push({
              alias: fieldWithAlias,
              expression,
            });
            continue;
          }

          const expression = OperandsMapExpression[operand].replace(
            EXPRESSION,
            paramsName
          );
          resultExpression.push({
            alias: fieldWithAlias,
            expression,
            params: {
              val: valueConditional,
              name: paramsName,
            },
          });
          continue;
        }

        const metadataRelation: TypeOrmRelationMetadata =
          this._relationMetadata[fieldName];
        const relationTarget = metadataRelation.inverseEntityMetadata.target;
        const relationAlias = this._relationAlias[fieldName];
        const subQuery = this.repository.createQueryBuilder().subQuery();

        const resultOperand =
          operand === FilterOperand.eq ? operand : FilterOperand.ne;
        switch (metadataRelation.relationType) {
          case 'many-to-many': {
            const subQuerySql = this.getSubQueryForManyToMany(fieldName);

            const resultOperand =
              operand === FilterOperand.eq ? operand : FilterOperand.ne;

            const expression = OperandsMapExpressionForNullRelation[
              resultOperand
            ].replace(EXPRESSION, subQuerySql);

            resultExpression.push({
              expression,
            });
            break;
          }
          case 'one-to-many': {
            const joinColumn = metadataRelation.inverseSidePropertyPath;

            const aliasPath = this.getAliasPath(joinColumn, fieldName);
            const subQuerySql = subQuery
              .select(aliasPath, joinColumn)
              .from(relationTarget, relationAlias)
              .where(
                `${aliasPath} = ${this.getAliasPath(this.currentPrimaryColumn)}`
              )
              .getQuery();

            const expression = OperandsMapExpressionForNullRelation[
              resultOperand
            ].replace(EXPRESSION, subQuerySql);

            resultExpression.push({
              expression,
            });
            break;
          }
          default: {
            const expression = OperandMapExpressionForNull[
              resultOperand
            ].replace(EXPRESSION, paramsName);
            resultExpression.push({
              alias: fieldWithAlias,
              expression,
            });
          }
        }
      }
    }

    return resultExpression;
  }

  getFilterExpressionForRelation(
    query: Query<E, IdKey>
  ): ResultQueryExpression[] {
    const resultExpression: ResultQueryExpression[] = [];
    const filterRelation = this.getFilterObject(query, 'relation');
    if (!filterRelation) return resultExpression;

    for (const [relationField, propsFilter] of ObjectTyped.entries(
      filterRelation
    )) {
      if (!propsFilter) continue;
      if (!isTargetField(this._relationFields, relationField)) continue;
      const metadataRelation: TypeOrmRelationMetadata =
        this._relationMetadata[relationField];

      const conditionalForManyToMany: {
        conditional: string;
        params: { name: string; val: string } | undefined;
      }[] = [];

      for (const [relationFieldProps, filter] of ObjectTyped.entries(
        propsFilter
      )) {
        if (!filter) continue;

        for (const entries of ObjectTyped.entries(filter)) {
          const [operand, value] = entries as [FilterOperand, string];
          const currentValue =
            operand === FilterOperand.like ? `%${value}%` : value;

          const paramsName = this.getParamName(
            this.getAliasPath(relationFieldProps.toString(), relationField)
          );
          let expression: string;
          if (value === 'null') {
            const currentOperand =
              operand === FilterOperand.eq
                ? FilterOperand.eq
                : FilterOperand.ne;
            expression = OperandMapExpressionForNull[currentOperand];
          } else {
            expression = OperandsMapExpression[operand].replace(
              EXPRESSION,
              paramsName
            );
          }

          const params =
            value === 'null'
              ? undefined
              : {
                  val: currentValue,
                  name: paramsName,
                };

          switch (metadataRelation.relationType) {
            case 'many-to-many': {
              conditionalForManyToMany.push({
                params,
                conditional: `${this.getAliasPath(
                  relationFieldProps.toString(),
                  this.getAliasForRelation(relationField)
                )} ${expression}`,
              });

              break;
            }
            default: {
              resultExpression.push({
                alias: this.getAliasPath(
                  relationFieldProps.toString(),
                  this.getAliasForRelation(relationField)
                ),
                expression,
                selectInclude: relationField.toString(),
                params,
              });
            }
          }
        }
      }

      if (conditionalForManyToMany.length) {
        const expression = conditionalForManyToMany.map((i) => i.conditional);
        const subQuery = this.getSubQueryForManyToMany(
          relationField,
          expression
        );

        const mainExpression = `IN ${subQuery}`;

        const params = conditionalForManyToMany
          .filter((i) => i.params)
          .map((i) => i.params) as { name: string; val: string }[];
        resultExpression.push({
          alias: this.getAliasPath(this.currentPrimaryColumn),
          expression: mainExpression,
          paramsForResult: expression,
          params,
        });
      }
    }
    return resultExpression;
  }

  private throwError(message: string, path: string[], key?: string) {
    const error: ValidateQueryError = {
      code: 'unrecognized_keys',
      path,
      message,
    };
    if (key) {
      error.keys = [key];
    }
    throw new BadRequestException([error]);
  }

  async *asyncIterateFindRelationships(
    relationships: NonNullable<
      PatchData<E, IdKey>['relationships'] | PostData<E, IdKey>['relationships']
    >
  ): AsyncGenerator<RelationshipsResult<E, IdKey>> {
    for (const entries of ObjectTyped.entries(relationships)) {
      const [props, dataItem] = entries;

      isRelationField(this._relationFields, props);
      if (dataItem === null || dataItem === undefined) continue;

      const { data } = dataItem as any;
      if (data === undefined) continue;
      if (data === null) {
        yield { [props]: null } as RelationshipsResult<E, IdKey>;
        continue;
      }
      const isArray = Array.isArray(data);
      if (isArray && data.length === 0) {
        yield { [props]: [] } as RelationshipsResult<E, IdKey>;
        continue;
      }

      const condition = isArray
        ? In((data as any[]).map((i) => i.id))
        : Equal(data['id']);
      const relationsTypeName = camelCase(
        isArray ? (data as any[])[0]['type'] : data['type']
      );
      const primaryField = this.getPrimaryColumnForRel(
        props as unknown as keyof RelationAlias<E>
      );
      const relationsTarget = Reflect.get(this._relationMetadata, props)
        .inverseEntityMetadata.target;
      const result = await this.repository.manager
        .getRepository(relationsTarget)
        .find({
          select: {
            [primaryField]: true,
          },
          where: {
            [primaryField]: condition,
          },
        });

      if (
        (isArray && (result.length === 0 || data.length !== result.length)) ||
        (!isArray && result.length === 0)
      ) {
        const message = isArray
          ? `Resource '${relationsTypeName}' with ids '${(data as any[])
              .map((i) => i.id)
              .filter((i) => !result.find((r) => r[primaryField] == i))
              .join(',')}' does not exist`
          : `Resource '${relationsTypeName}' with id '${data.id}' does not exist`;

        const error: ValidateQueryError = {
          code: 'invalid_arguments',
          path: ['data', 'relationships', String(props)],
          message,
        };

        throw new BadRequestException([error]);
      }

      yield { [props]: isArray ? result : result[0] } as RelationshipsResult<
        E,
        IdKey
      >;
    }
  }

  async saveEntityData(
    target: E,
    relationships:
      | PatchData<E, IdKey>['relationships']
      | PostData<E, IdKey>['relationships']
  ): Promise<E> {
    if (relationships) {
      for await (const item of this.asyncIterateFindRelationships(
        relationships
      )) {
        const [props, type] = ObjectTyped.entries(item)[0];
        if (type !== null) {
          target[props] = type as any;
        } else {
          target[props] = null as any;
        }
      }
    }

    const saveData = await this.repository.save(target);
    let saveDataWithRelation: E | null = null;
    if (relationships) {
      const queryBuilder = this.repository
        .createQueryBuilder(this.currentAlias)
        .where({
          [this.currentPrimaryColumn]: Equal(
            saveData[this.currentPrimaryColumn]
          ),
        });

      for (const [props] of ObjectTyped.entries(relationships)) {
        const currentIncludeAlias = this.getAliasForRelation(
          props as unknown as keyof RelationAlias<E>
        );

        queryBuilder.leftJoinAndSelect(
          this.getAliasPath(props),
          currentIncludeAlias
        );
      }

      saveDataWithRelation = await queryBuilder.getOne();
    }

    return saveDataWithRelation ? saveDataWithRelation : saveData;
  }

  async validateRelationInputData<
    Rel extends RelationKeys<E, IdKey>,
    In extends InputValidateData | InputValidateData[]
  >(rel: Rel, inputData: In): Promise<ValidateReturn<In>>;
  async validateRelationInputData<
    Rel extends RelationKeys<E, IdKey>,
    In extends InputValidateData | InputValidateData[]
  >(rel: Rel, inputData: In): Promise<ValidateReturn<In>>;
  async validateRelationInputData<
    Rel extends RelationKeys<E, IdKey>,
    In extends null | InputValidateData | InputValidateData[]
  >(rel: Rel, inputData: In): Promise<ValidateReturn<In>>;
  async validateRelationInputData<
    Rel extends RelationKeys<E, IdKey>,
    In extends null | InputValidateData | InputValidateData[]
  >(rel: Rel, inputData: In): Promise<ValidateReturn<In>> {
    const relationMetadata = Reflect.get(this._relationMetadata, rel);
    const isArray = Array.isArray(inputData);

    if (
      ['one-to-many', 'many-to-many'].includes(relationMetadata.relationType) &&
      !isArray
    ) {
      const error: ValidateQueryError = {
        code: 'invalid_arguments',
        path: ['data'],
        message: 'Body data should be array',
      };

      throw new UnprocessableEntityException([error]);
    }

    if (
      ['one-to-one', 'many-to-one'].includes(relationMetadata.relationType) &&
      isArray
    ) {
      const error: ValidateQueryError = {
        code: 'invalid_arguments',
        path: ['data'],
        message: 'Body data should be object',
      };

      throw new UnprocessableEntityException([error]);
    }
    if (inputData === null) {
      const result = null;
      return result as ValidateReturn<In>;
    }
    if (isArray && inputData.length === 0) {
      const result: any[] = [];
      return result as ValidateReturn<In>;
    }

    const prepareData = isArray ? inputData : [inputData];

    const errors: ValidateQueryError[] = [];
    let i = 0;
    const typeName = kebabCase(
      getEntityName(relationMetadata.inverseEntityMetadata.target)
    );

    for (const prepareItem of prepareData) {
      if (prepareItem.type !== typeName) {
        const path = isArray ? ['data', i.toString()] : ['data'];
        errors.push({
          code: 'invalid_arguments',
          path: path,
          message: `Type should be equal to type of relName: "${rel.toString()}". Type of ${rel.toString()} is "${typeName}" but receive - "${
            prepareItem.type
          }"`,
        });
      }
      i++;
    }
    if (errors.length) {
      throw new UnprocessableEntityException(errors);
    }

    const checkResult = await this.repository.manager
      .getRepository(relationMetadata.inverseEntityMetadata.target)
      .find({
        select: {
          [this.getPrimaryColumnForRel(
            rel as unknown as keyof RelationAlias<E>
          )]: true,
        },
        where: {
          [this.getPrimaryColumnForRel(
            rel as unknown as keyof RelationAlias<E>
          )]: In(prepareData.map((i) => i.id)),
        },
      });

    if (checkResult.length === prepareData.length) {
      return (
        isArray ? inputData.map((i) => i.id) : inputData.id
      ) as ValidateReturn<In>;
    }

    const resulDataMap = checkResult.reduce((acum, item) => {
      acum[
        item[
          this.getPrimaryColumnForRel(rel as unknown as keyof RelationAlias<E>)
        ]
      ] = true;
      return acum;
    }, {} as Record<string, boolean>);

    i = 0;
    for (const item of prepareData) {
      if (!resulDataMap[item.id]) {
        const path = isArray ? ['data', i.toString(), 'id'] : ['data', 'id'];
        errors.push({
          code: 'invalid_arguments',
          path: path,
          message: `Not exist item "${
            item.id
          }" in relation "${rel.toString()}"`,
        });
      }
      i++;
    }
    throw new NotFoundException(errors);
  }
}
