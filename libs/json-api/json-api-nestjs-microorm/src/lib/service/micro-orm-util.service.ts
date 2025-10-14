import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  EntityClass,
  EntityKey,
  EntityProperty,
  EntityRepository,
  type QBFilterQuery,
  QBQueryOrderMap,
  raw,
  ReferenceKind,
  EntityData,
  Collection,
} from '@mikro-orm/core';
import {
  type Knex,
  SqlEntityManager,
  QueryBuilder,
  type Field,
} from '@mikro-orm/knex';
import {
  ASC,
  CURRENT_ENTITY,
  ValidateQueryError,
  Query,
  QueryOne,
  Relationships,
} from '@klerick/json-api-nestjs';
import {
  RelationKeys,
  FilterOperand,
  ObjectTyped,
} from '@klerick/json-api-nestjs-shared';
import { kebabCase } from 'change-case-commonjs';
import {
  CURRENT_ENTITY_MANAGER_TOKEN,
  CURRENT_ENTITY_REPOSITORY,
} from '../constants';

export type InputValidateData = {
  type: string;
  id: string;
};

export type ValidateReturn<T> = T extends unknown[]
  ? string[]
  : T extends null
  ? null
  : string;

type RelationshipsResult<E extends object> = {
  [K in RelationKeys<E>]: E[K] extends object
    ? E[K] extends Collection<E[K]>
      ? E[K]
      : E[K] | null
    : never;
};

function isRelationField<E extends object>(
  relationField: string[],
  field: any
): asserts field is EntityKey<E, false> {
  if (relationField.includes(field)) return;
  const error: ValidateQueryError = {
    code: 'unrecognized_keys',
    path: ['data', 'relationships'],
    message: `Resource for relation '${field.toString()}' does not exist`,
    keys: [field],
  };

  throw new BadRequestException([error]);
}

function isCollectionField<E extends object>(
  targetInstance: any
): targetInstance is Collection<E> {
  return targetInstance instanceof Collection;
}

const getErrorObject = (
  props: string,
  message: string
): ValidateQueryError => ({
  code: 'invalid_arguments',
  path: ['data', 'relationships'],
  message,
});

Injectable();
export class MicroOrmUtilService<
  E extends object,
  IdKey extends string = 'id'
> {
  @Inject(CURRENT_ENTITY_MANAGER_TOKEN)
  public readonly entityManager!: SqlEntityManager;
  @Inject(CURRENT_ENTITY_REPOSITORY)
  private entityRepository!: EntityRepository<E>;
  @Inject(CURRENT_ENTITY) public readonly entity!: EntityClass<E>;

  private _relationsName!: EntityKey<E, false>[];
  private _relationMap = new Map<EntityKey<E, false>, EntityProperty<E>>();
  private _relationPropsMap = new Map<EntityClass<E>, EntityKey<E, false>[]>();
  get relationsName() {
    if (!this._relationsName) {
      this._relationsName = this.metadata.relations.map((r) => r.name);
    }

    return this._relationsName;
  }

  getRelationProps(entity: EntityClass<E>) {
    const props = this._relationPropsMap.get(entity);
    if (props) {
      return props;
    }
    const relMetaData = this.entityManager.getMetadata(entity);
    const relation = relMetaData.relations.map((i) => i.name);
    const newProps = relMetaData.props
      .filter((r) => !relation.includes(r.name))
      .map((r) => r.name);
    this._relationPropsMap.set(entity, newProps);

    return newProps;
  }

  getRelation(name: EntityKey<E, false>) {
    let relation = this._relationMap.get(name);
    if (!relation) {
      relation = this.metadata.relations.find((r) => r.name === name);
      if (!relation) {
        throw new Error(`Relation ${name} not found in ${this.metadata.name}`);
      }
      this._relationMap.set(name, relation);
    }

    return relation;
  }

  get currentAlias() {
    return this.entityRepository.getEntityName();
  }

  get metadata() {
    return this.entityManager.getMetadata().get(this.entity);
  }

  get currentPrimaryColumn() {
    return this.metadata.getPrimaryProp().name;
  }

  get defaultOrder(): QBQueryOrderMap<E> {
    return {
      [this.currentPrimaryColumn]: ASC,
    };
  }

  getAliasForEntity<T = E>(entity: EntityClass<T>) {
    return this.entityManager.getRepository(entity).getEntityName();
  }

  getAliasForPivotTable<T = E>(relName: keyof T): string;
  getAliasForPivotTable<T = E>(
    entity: EntityClass<T>,
    relName: keyof T
  ): string;
  getAliasForPivotTable<T = E>(
    entity: EntityClass<T> | keyof T,
    relName?: keyof T
  ): string {
    if (!relName) {
      relName = entity as keyof T;
      entity = this.entity;
    } else {
      entity = entity as EntityClass<T>;
    }

    const propsRelation = this.entityManager
      .getMetadata()
      .get(entity)
      .relations.find((r) => r.name.toString() === relName.toString());
    if (!propsRelation)
      throw new Error(`${relName.toString()} relation not found`);
    if (propsRelation.kind !== ReferenceKind.MANY_TO_MANY)
      throw new Error('Many to many relation expected');

    return this.entityManager
      .getRepository(propsRelation.pivotEntity)
      .getEntityName();
  }

  queryBuilder<T extends object = E>(
    entity: EntityClass<T>,
    alias: string
  ): QueryBuilder<T, typeof alias>;
  queryBuilder<T extends object = E>(
    entity: EntityClass<T>
  ): QueryBuilder<T, string>;
  queryBuilder<T extends object = E>(
    alias: string
  ): QueryBuilder<T, typeof alias>;
  queryBuilder<T extends object = E>(): QueryBuilder<T, string>;
  queryBuilder<T extends object = E>(
    ...arg:
      | [entity: EntityClass<T>, alias: string]
      | [entity: EntityClass<T>]
      | [alias: string]
      | [undefined, undefined]
  ): QueryBuilder<T, string> {
    let [entity, alias] = arg;

    if (entity && !alias) {
      if (typeof entity === 'string') {
        alias = entity;
        entity = this.entity;
      } else {
        alias = this.getAliasForEntity(entity);
      }
    }
    if (!entity) {
      alias = this.currentAlias;
      entity = this.entity;
    }

    if (!entity || !alias) {
      throw new Error('entity or alias not found');
    }

    return this.entityManager.createQueryBuilder<T, typeof alias>(
      entity,
      alias
    );
  }

  getFilterExpressionForTarget<T extends object = E>(
    query: Query<T, IdKey>
  ): QBFilterQuery<T>[] {
    const result: QBFilterQuery<T>[] = [];
    const filterTarget = this.getFilterObject(query, 'target');
    const { sort, include } = query;
    if (!filterTarget) return result;

    for (const [fieldName, filter] of ObjectTyped.entries(filterTarget)) {
      const tmpField = fieldName as unknown as EntityKey<E, false>;

      if (filter === undefined) continue;
      const filterObject: QBFilterQuery<T> = {
        [tmpField]: {},
      };
      let subQueryExpression: QBFilterQuery<T> | undefined;

      for (const entries of ObjectTyped.entries(filter as any)) {
        const [operand, valueInput] = entries as [FilterOperand, string];

        const value =
          operand === FilterOperand.like ? `%${valueInput}%` : valueInput;

        if (!this.relationsName.includes(tmpField)) {
          const operandForMiroOrmResult = this.extractedResultOperand(operand);
          filterObject[tmpField.toString()][operandForMiroOrmResult] = value;
          continue;
        }

        const relation = this.getRelation(tmpField);
        switch (relation.kind) {
          case ReferenceKind.MANY_TO_MANY:
          case ReferenceKind.ONE_TO_MANY: {
            if (sort && tmpField in sort) {
              filterObject[tmpField.toString()]['$exists'] =
                operand === FilterOperand.ne;
              break;
            }

            if (include && include.includes(tmpField as any)) {
              filterObject[tmpField.toString()]['$exists'] =
                operand === FilterOperand.ne;
              break;
            }

            const subQuery =
              this.getSubQueryForRelation(tmpField).getFormattedQuery();
            const type = operand === FilterOperand.ne ? 'exists' : 'not exists';
            const resultQuery = `${type} (${subQuery})`;
            subQueryExpression = raw(resultQuery);
            break;
          }
          default:
            filterObject[tmpField.toString()]['$exists'] =
              operand === FilterOperand.ne;
        }
      }

      result.push(subQueryExpression ? subQueryExpression : filterObject);
    }

    return result;
  }

  getConditionalForJoin<T extends object = E>(
    query: Query<T, IdKey>,
    key: string
  ): QBFilterQuery {
    const filterRelation = this.getFilterObject(query, 'relation');

    if (!filterRelation) return {};
    if (!(key in (filterRelation as object))) return {};

    for (const [key, reletionConditional] of ObjectTyped.entries(
      filterRelation
    )) {
      if (key !== key) continue;
      if (!reletionConditional) continue;

      for (const [field, conditional] of ObjectTyped.entries(
        reletionConditional
      )) {
        if (!conditional) continue;
        return Object.entries(conditional).reduce((acum, [operand, value]) => {
          acum[field.toString()] = {
            ...(acum[field.toString()] || {}),
            [this.extractedResultOperand(operand as FilterOperand)]: value,
          };
          return acum;
        }, {} as QBFilterQuery);
      }
    }

    return {};
  }

  private extractedResultOperand(operand: FilterOperand) {
    if (
      operand === FilterOperand.like &&
      this.entityManager.getDriver().constructor.name === 'PostgreSqlDriver'
    ) {
      return '$ilike';
    }

    return operand === 'regexp'
      ? '$re'
      : operand === 'some'
      ? '$overlap'
      : (('$' + operand) as `$${FilterOperand}`);
  }

  getFilterExpressionForRelation<T extends object = E>(
    query: Query<T, IdKey>
  ): QBFilterQuery<T>[] {
    const result: QBFilterQuery<T>[] = [];
    const filterRelation = this.getFilterObject(query, 'relation');
    const sort = query.sort;
    if (!filterRelation) return result;

    for (const [relationField, propsFilter] of ObjectTyped.entries(
      filterRelation
    )) {
      const fieldName = relationField as unknown as EntityKey<E, false>;
      const relationProps = this.getRelation(fieldName);
      if (!propsFilter) continue;
      if (!this.relationsName.includes(fieldName)) continue;
      const filterObject: QBFilterQuery<T> = {
        [relationField]: {},
      };
      let subQueryExpression:
        | ReturnType<typeof this.getSubQueryForRelation>
        | undefined;
      for (const [relationFieldProps, filter] of ObjectTyped.entries(
        propsFilter
      )) {
        const fieldProps = relationFieldProps as unknown as EntityKey<E, false>;
        if (!filter) continue;
        for (const entries of ObjectTyped.entries(filter)) {
          const [operand, value] = entries as [FilterOperand, string];
          switch (relationProps.kind) {
            case ReferenceKind.MANY_TO_MANY:
            case ReferenceKind.ONE_TO_MANY:
            case ReferenceKind.MANY_TO_ONE:
              {
                if (sort && relationField in sort) {
                  filterObject[fieldName][fieldProps] = filterObject[fieldName][
                    fieldProps
                  ] = filterObject[fieldName][fieldProps] || {};
                  filterObject[fieldName][fieldProps][
                    this.extractedResultOperand(operand)
                  ] = value;
                } else {
                  if (!subQueryExpression) {
                    subQueryExpression = this.getSubQueryForRelation(fieldName);
                  }
                  const expression =
                    relationProps.kind === ReferenceKind.MANY_TO_MANY
                      ? {
                          [this.getInverseFieldForManyToMany(fieldName)]: {
                            [fieldProps]: {
                              [this.extractedResultOperand(operand)]: value,
                            },
                          },
                        }
                      : {
                          [fieldProps]: {
                            [this.extractedResultOperand(operand)]: value,
                          },
                        };
                  subQueryExpression.where(expression, '$and');
                }
              }
              break;
            default:
              filterObject[fieldName][fieldProps] =
                filterObject[fieldName][fieldProps] || {};
              filterObject[fieldName][fieldProps][
                this.extractedResultOperand(operand)
              ] = value;
          }
        }
      }
      if (subQueryExpression) {
        const resultQuery = `exists (${subQueryExpression.getFormattedQuery()})`;
        result.push(raw(resultQuery));
        subQueryExpression = undefined;
      } else {
        result.push(filterObject);
      }
    }

    return result;
  }

  getKnex(): Knex<E, E[]> {
    return this.entityManager.getKnex();
  }

  prePareQueryBuilder(
    queryBuilder: QueryBuilder<E>,
    query: Query<E, IdKey> | QueryOne<E, IdKey>
  ): QueryBuilder<E> {
    const { fields, include } = query;
    const relationFields: Record<string, []> = {};

    if (fields) {
      const { target, ...relations } = fields as any;
      Object.assign(relationFields, relations);
      if (target) {
        if (!target.includes(this.currentPrimaryColumn)) {
          target.unshift(this.currentPrimaryColumn);
        }
        queryBuilder.select(target as unknown as Field<E>);
      }
    }

    const resultInclude = new Set([
      ...[...(include || []), ...ObjectTyped.keys(relationFields)],
    ]);

    for (const itemFromloop of resultInclude) {
      const item = itemFromloop as unknown as EntityKey<E, false>;
      const relationProps = this.getRelation(item);
      const relationEntity = relationProps.entity() as EntityClass<E>;
      const relationAlias = this.getAliasForEntity(relationEntity);
      const mainAlias = this.currentAlias;

      const condition: QBFilterQuery = this.getConditionalForJoin(
        query as Query<E, IdKey>,
        item
      );

      let selectJoin: string[] = this.getRelationProps(relationEntity);
      if (item in relationFields) {
        const tmpSet = new Set<string>([
          ...relationFields[item],
          this.getPrimaryNameFor(item as any),
        ]);

        selectJoin = [...tmpSet];
      }

      queryBuilder.leftJoinAndSelect(
        `${mainAlias}.${item}`,
        `${relationAlias}__${item}`,
        condition,
        selectJoin
      );
    }
    return queryBuilder;
  }

  getPrimaryNameFor(rel: RelationKeys<E, IdKey>) {
    const relationEntity = this.getRelation(
      rel as unknown as EntityKey<E, false>
    ).entity() as EntityClass<E>;
    return this.entityManager.getMetadata().get(relationEntity).getPrimaryProp()
      .name;
  }

  private getFilterObject<T extends object>(
    query: Query<T, IdKey>,
    filterType: 'target' | 'relation'
  ) {
    const { filter } = query;
    if (!filter) return null;
    return Reflect.get(filter, filterType);
  }

  private getSubQueryForRelation(propsName: EntityKey<E, false>) {
    const relation = this.getRelation(propsName);

    let pivotTableName;
    let filedCheck: string | undefined;
    let expressionColumnName: string | undefined = this.currentPrimaryColumn;
    if (relation.kind === ReferenceKind.MANY_TO_MANY) {
      pivotTableName = this.getAliasForPivotTable<E>(propsName);
      filedCheck = relation.joinColumns.at(0);
    } else if (relation.kind === ReferenceKind.ONE_TO_MANY) {
      pivotTableName = this.getAliasForEntity(relation.entity() as any);
      filedCheck = relation.mappedBy;
    } else {
      expressionColumnName = relation.joinColumns.at(0);
      pivotTableName = this.getAliasForEntity(relation.entity() as any);
      filedCheck = relation.referencedColumnNames.at(0);
    }

    if (!filedCheck) throw new Error('filedCheck not found');
    if (!expressionColumnName)
      throw new Error('expressionColumnName not found');

    return this.entityManager
      .createQueryBuilder(pivotTableName, pivotTableName)
      .select(raw('1'))
      .from(pivotTableName)
      .where({
        [filedCheck]: this.entityManager
          .getKnex()
          .ref(`${this.currentAlias}.${expressionColumnName}`),
      });
  }

  private getInverseFieldForManyToMany(propsName: EntityKey<E, false>) {
    const relation = this.getRelation(propsName);
    const pivotTableName = this.getAliasForPivotTable<E>(propsName);

    const pivotMetaData = this.entityManager.getMetadata().get(pivotTableName);

    const props = pivotMetaData.props.find(
      (prop) =>
        prop.targetMeta &&
        prop.targetMeta.properties[propsName] &&
        prop.targetMeta.properties[propsName].entity() === relation.entity()
    );

    if (!props)
      throw new Error(
        `ManyToMany relation ${propsName} not found in ${pivotTableName}`
      );

    return props.inversedBy || props.mappedBy;
  }

  createEntity(params: EntityData<E>) {
    return this.entityManager.create(this.entity, params, {
      partial: true,
      persist: false,
    });
  }

  private async *asyncIterateFindRelationships(
    relationships: NonNullable<Relationships<E, IdKey>>
  ): AsyncGenerator<RelationshipsResult<E>> {
    for (const entries of ObjectTyped.entries(relationships)) {
      const [props, dataItem] = entries;
      isRelationField(this.relationsName, props);
      const propsKey = props as unknown as EntityKey<E, false>;
      if (dataItem === undefined) continue;

      const data = Reflect.get(dataItem as object, 'data');
      if (data === undefined) continue;
      if (data === null) {
        yield { [props]: null } as RelationshipsResult<E>;
        continue;
      }
      const isArray = Array.isArray(data);
      if (isArray && data.length === 0) {
        yield { [props]: [] } as RelationshipsResult<E>;
        continue;
      }

      const condition = isArray
        ? {
            $in: data.map((i) => (i || {}).id),
          }
        : {
            $eq: data['id'],
          };

      const relationProps = this.metadata.properties[propsKey];
      const relationEntity = relationProps.entity() as EntityClass<any>;
      const metadata = this.entityManager.getMetadata().get(relationEntity);
      const primaryName = metadata.getPrimaryProp().name;

      const queryBuilder = this.queryBuilder(
        relationEntity,
        this.getAliasForEntity(relationEntity)
      )
        .select([primaryName])
        .where({
          [primaryName]: condition,
        });
      let result: typeof relationEntity | (typeof relationEntity)[];
      let error: BadRequestException | undefined = undefined;
      if (isArray) {
        const tmpResult = await queryBuilder.getResult();

        if (tmpResult.length === 0 || data.length !== tmpResult.length) {
          const msg = `Resource '${metadata.className}' with ids '${data
            .map((i) => (i || {})['id'])
            .filter((i) => !tmpResult.find((r) => r[primaryName] == i))
            .join(',')}' does not exist`;
          error = new BadRequestException([getErrorObject(props, msg)]);
        }
        result = tmpResult;
      } else {
        const tmpResult = await queryBuilder.getSingleResult();
        if (!tmpResult)
          error = new BadRequestException([
            getErrorObject(
              props,
              `Resource '${metadata.className}' with id '${data.id}' does not exist`
            ),
          ]);
        result = tmpResult;
      }
      if (error) throw error;
      yield { [props]: result } as RelationshipsResult<E>;
    }
  }

  async saveEntity(
    targetInstance: E,
    relationships?: Relationships<E, IdKey>
  ): Promise<E> {
    if (relationships) {
      for await (const item of this.asyncIterateFindRelationships(
        relationships
      )) {
        const itemProps = ObjectTyped.entries(item).at(0);
        if (!itemProps) continue;
        const [nameProps, data] = itemProps;

        if (isCollectionField(targetInstance[nameProps])) {
          targetInstance[nameProps].removeAll();
          targetInstance[nameProps].add(data as []);
        } else {
          Object.assign(targetInstance, item);
        }
      }
    }

    await this.entityManager.persistAndFlush(targetInstance);

    return targetInstance;
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
    const property = Reflect.get(this.metadata.properties, rel);
    const isArray = Array.isArray(inputData);

    if (
      [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(
        property.kind
      ) &&
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
      [ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(
        property.kind
      ) &&
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

    const prepareData = (
      isArray ? inputData : [inputData]
    ) as InputValidateData[];

    const errors: ValidateQueryError[] = [];
    let i = 0;
    const relationEntity = this.getRelation(rel as any).entity();
    const typeName = kebabCase(
      this.entityManager.getMetadata().get(relationEntity).className
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

    const checkResult = await this.queryBuilder(relationEntity as any)
      .where({
        [this.getPrimaryNameFor(rel)]: {
          $in: prepareData.map((i) => i.id),
        },
      })
      .getResult();

    if (checkResult.length === prepareData.length) {
      return (
        isArray ? inputData.map((i) => i.id) : inputData.id
      ) as ValidateReturn<In>;
    }

    const resulDataMap = checkResult.reduce((acum, item) => {
      const idValue = (item[this.getPrimaryNameFor(rel)] || 'empty').toString();
      acum[idValue] = true;
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
