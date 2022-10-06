import {BadRequestException} from '@nestjs/common';
import {OrderByCondition} from 'typeorm/find-options/OrderByCondition';

import {TypeormMixinService} from '../../typeorm.mixin'
import {ServiceOptions, SortType} from '../../../../../types';
import {ResourceObject} from '../../../../../types-common';

import {snakeToCamel} from '../../../../../helper';

export async function getAll<T>(
  this: TypeormMixinService<T>,
  options: ServiceOptions<T>,
): Promise<ResourceObject<T>> {
  const startTime = Date.now();
  const {filter, include, sort, page, fields} = options.query;
  if (this.config.requiredSelectField && fields === null) {
    throw new BadRequestException([{
      source: {parameter: '/fields'},
      detail: 'Fields params in query is required'
    }])
  }

  const preparedResourceName = snakeToCamel(this.repository.metadata.name);

  const builder = this.repository.createQueryBuilder(preparedResourceName);
  const resultBuilderQuery = this.repository.createQueryBuilder(preparedResourceName)

  if (!this.UtilsMethode.relationNameMapByEntity.has(preparedResourceName)) {
    this.UtilsMethode.relationNameMapByEntity.set(preparedResourceName, new Set(this.repository.metadata.relations.map(item => item.propertyName)));
  }

  const fieldsSelect: Set<string> = (include || []).reduce((acum, i) => {
    acum.add(i);
    return acum;
  }, new Set<string>());

  fieldsSelect.add(preparedResourceName);

  if (fields) {
    fieldsSelect.clear();

    for (const rel of (include || [])) {
      const propsName = this.repository.metadata.relations
        .find(relations => relations.propertyName === rel)
        .entityMetadata.primaryColumns[0].propertyName;
      fieldsSelect.add(`${rel}.${propsName}`);
    }

    const {target, ...other} = fields;
    const targetArray = ([...target, this.repository.metadata.primaryColumns[0].propertyName] || []);
    for (const fieldTarget of targetArray) {
      fieldsSelect.add(`${preparedResourceName}.${fieldTarget}`)
    }

    Object.keys(other || {}).forEach(relation => {
      (other[relation] || [])
        .forEach(i => {
          fieldsSelect.add(`${relation}.${i}`)
        })
    })
  }

  const {target, relation} = filter;

  const expressionObject = [
    ...target ? this.UtilsMethode.applyQueryFiltersTarget(builder, target, this.repository.metadata) : [],
    ...relation ? this.UtilsMethode.applyQueryFilterRelation(builder, relation, this.repository.metadata) : []
  ]
  const expressionObjectLength = expressionObject.length;
  const includeLength = include ? include.length : 0;
  const joinForCommonQuery = {};

  for (let i = 0; i < expressionObjectLength; i++) {
    const {expression, params, selectInclude} = expressionObject[i];
    if (selectInclude) {
      joinForCommonQuery[`${preparedResourceName}.${selectInclude}`] = selectInclude
    }
    builder[i === 0 ? 'where' : 'andWhere'](expression);
    if (params) {
      builder.setParameters(params ? {[params.name]: params.val} : {});
    }
  }
  for (let i = 0; i < includeLength; i++) {
    const relationName = include[i];
    resultBuilderQuery.leftJoin(`${preparedResourceName}.${relationName}`, relationName);
  }
  const subQueryIdAlias = 'subQueryId';
  const primaryColumn = this.repository.metadata.primaryColumns[0].databaseName;
  builder.select(`${preparedResourceName}.${primaryColumn}`, subQueryIdAlias)


  if (sort) {
    const {target, ...otherSort} = sort;
    const targetOrder = Object.entries<SortType>(target || {}).reduce<OrderByCondition>((acum, [key, val]) => {
      acum[`${preparedResourceName}.${key}`] = val
      return acum;
    }, {})
    const relationOrder = Object.keys(otherSort || {}).reduce<OrderByCondition>((acum, relation) => {
      return Object.entries<SortType>((otherSort || {})[relation]).reduce<OrderByCondition>((a, [key, val]) => {
        a[`${relation}.${key}`] = val;
        return a;
      }, acum)
    }, {});
    for (const relItem in relationOrder) {
      const [rel, field] = relItem.split('.');
      joinForCommonQuery[`${preparedResourceName}.${rel}`] = rel
    }

    builder.orderBy({
      ...targetOrder,
      ...relationOrder
    });
  } else {
    builder.orderBy({
      [`${preparedResourceName}.${primaryColumn}`]: 'ASC'
    });
  }

  for (const join in joinForCommonQuery) {
    builder.leftJoin(join, joinForCommonQuery[join])
  }
  const prepareParams = Date.now() - startTime
  const count = await builder.getCount();
  const skip = (page.number - 1) * page.size;

  builder
    .offset(skip)
    .limit(page.size);
  const countAlias = 'countResult';



  const resultIds = await this.repository.createQueryBuilder(countAlias)
    .select(`${countAlias}.${primaryColumn}`)
    .innerJoin(`(${builder.getQuery()})`, 'subQuery', `"subQuery"."${subQueryIdAlias}" = ${countAlias}.${primaryColumn}`)
    .setParameters(builder.getParameters())
    .getRawMany<T>();

  const result = await resultBuilderQuery
    .select([...fieldsSelect])
    .whereInIds(resultIds.map(i => i[`${countAlias}_${primaryColumn}`]))
    .getRawMany();

  const callQuery = Date.now() - startTime;

  const entityArray: T[] = this.transform.transformRawData(result);
  const data = entityArray.map(i => this.transform.transformData(i, include));
  const included = this.transform.transformInclude(entityArray);

  const transform = Date.now() - startTime;
  const debug = {
    prepareParams,
    callQuery: callQuery - prepareParams,
    transform: transform - callQuery
  };
  return {
    meta: {
      pageNumber: page.number,
      totalItems: count,
      pageSize: page.size,
      ...(this.config.debug ? {debug} : {})
    },
    data,
    included
  }
}


