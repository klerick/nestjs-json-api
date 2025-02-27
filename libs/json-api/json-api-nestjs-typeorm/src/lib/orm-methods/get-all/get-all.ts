import { Query, ASC, DESC } from '@klerick/json-api-nestjs';
import { ObjectTyped, ResourceObject } from '@klerick/json-api-nestjs-shared';

import { TypeOrmService } from '../../service';

import {
  ALIAS_FOR_PAGINATION,
  SUB_QUERY_ALIAS_FOR_PAGINATION,
} from '../../constants';

type OrderByCondition = Record<string, 'ASC' | 'DESC'>;

function getSortObject(params: any, relationName: string) {
  return Object.entries(params).reduce((acum, [props, sort]) => {
    acum[`${relationName}.${props}`] = `${sort}` === ASC ? ASC : DESC;
    return acum;
  }, {} as OrderByCondition);
}

export async function getAll<E extends object, IdKey extends string = 'id'>(
  this: TypeOrmService<E, IdKey>,
  query: Query<E, IdKey>
): Promise<ResourceObject<E, 'array', null, IdKey>> {
  const { fields, include, sort, page } = query;

  let defaultSortObject: OrderByCondition = {
    [`${
      this.typeormUtilsService.currentAlias
    }.${this.typeormUtilsService.currentPrimaryColumn.toString()}`]: ASC,
  };

  const includeForCountQuery = new Set<string>();
  const selectFields = new Set<string>();
  const includeRel = new Set<string>();

  const skip = (page.number - 1) * page.size;

  const expressionArrayForTarget =
    this.typeormUtilsService.getFilterExpressionForTarget(query);
  const expressionArrayForRelation =
    this.typeormUtilsService.getFilterExpressionForRelation(query);
  const expressionArray = [
    ...expressionArrayForTarget,
    ...expressionArrayForRelation,
  ];
  const sortCast = sort as Query<Record<string, any>, IdKey>['sort'];
  if (sortCast) {
    const { target, ...relation } = sortCast;
    const targetOrder = getSortObject(
      target || {},
      this.typeormUtilsService.currentAlias
    );

    const relOrder = Object.entries(relation || {}).reduce(
      (acum, [name, order]) => {
        return {
          ...acum,
          ...getSortObject(
            order || {},
            this.typeormUtilsService.getAliasForRelation(name as any)
          ),
        };
      },
      {} as OrderByCondition
    );
    const resultOrder = {
      ...targetOrder,
      ...relOrder,
    };
    if (Object.keys(resultOrder).length > 0) {
      defaultSortObject = resultOrder;
    }
    for (const item of ObjectTyped.keys(relation)) {
      includeForCountQuery.add(item);
    }
  }

  const queryBuilderForCount = this.repository
    .createQueryBuilder(this.typeormUtilsService.currentAlias)
    .select(
      this.typeormUtilsService.getAliasPath(
        this.typeormUtilsService.currentPrimaryColumn
      ),
      this.typeormUtilsService.currentPrimaryColumn.toString()
    )
    .orderBy(defaultSortObject);

  for (const i in expressionArray) {
    const { params, alias, selectInclude, expression } = expressionArray[i];
    const expressionTempArray: string[] = [];
    if (alias) {
      expressionTempArray.push(alias);
    }
    expressionTempArray.push(expression);
    queryBuilderForCount[i === '0' ? 'where' : 'andWhere'](
      expressionTempArray.join(' ')
    );
    if (params) {
      if (Array.isArray(params)) {
        for (const { name, val } of params) {
          queryBuilderForCount.setParameters({ [name]: val });
        }
      } else {
        queryBuilderForCount.setParameters({ [params.name]: params.val });
      }
    }
    if (selectInclude) includeForCountQuery.add(selectInclude);
  }

  for (const rel of [...includeForCountQuery]) {
    const currentIncludeAlias = this.typeormUtilsService.getAliasForRelation(
      rel as any
    );
    queryBuilderForCount.leftJoin(
      this.typeormUtilsService.getAliasPath(rel),
      currentIncludeAlias
    );
  }

  const count = await queryBuilderForCount.getCount();
  const meta = {
    pageNumber: page.number,
    totalItems: count,
    pageSize: page.size,
  };

  if (count === 0) {
    return {
      meta,
      data: [],
    };
  }

  const aliasForIdResultPagination = this.typeormUtilsService.getAliasPath(
    this.typeormUtilsService.currentPrimaryColumn,
    ALIAS_FOR_PAGINATION,
    '_'
  );

  const resultIds = await this.repository
    .createQueryBuilder(ALIAS_FOR_PAGINATION)
    .select(
      this.typeormUtilsService.getAliasPath(
        this.typeormUtilsService.currentPrimaryColumn,
        ALIAS_FOR_PAGINATION
      ),
      aliasForIdResultPagination
    )
    .innerJoin(
      `(${queryBuilderForCount.offset(skip).limit(page.size).getQuery()})`,
      SUB_QUERY_ALIAS_FOR_PAGINATION,
      `${this.typeormUtilsService.getAliasPath(
        queryBuilderForCount.escape(
          this.typeormUtilsService.currentPrimaryColumn.toString()
        ),
        queryBuilderForCount.escape(SUB_QUERY_ALIAS_FOR_PAGINATION)
      )} = ${this.typeormUtilsService.getAliasPath(
        this.typeormUtilsService.currentPrimaryColumn,
        ALIAS_FOR_PAGINATION
      )}`
    )
    .setParameters(queryBuilderForCount.getParameters())
    .getRawMany<{
      [K: typeof aliasForIdResultPagination]: number;
    }>();

  const ids = resultIds.map((i) => i[aliasForIdResultPagination]);
  if (ids.length === 0) {
    return {
      meta,
      data: [],
    };
  }
  if (include) {
    for (const rel of include) {
      includeRel.add(rel);
    }
  }
  const fieldsCast = fields as Query<Record<string, any>, IdKey>['fields'];
  if (fieldsCast) {
    if (include) {
      for (const rel of include) {
        const currentIncludeAlias =
          this.typeormUtilsService.getAliasForRelation(rel);
        const primaryColumnName =
          this.typeormUtilsService.getPrimaryColumnForRel(rel);
        selectFields.add(`${currentIncludeAlias}.${primaryColumnName}`);
      }
    }

    const { target, ...other } = fieldsCast;
    if (target) {
      for (const item of target) {
        selectFields.add(`${this.typeormUtilsService.currentAlias}.${item}`);
      }
    }

    for (const [rel, fields] of ObjectTyped.entries(other)) {
      const currentIncludeAlias = this.typeormUtilsService.getAliasForRelation(
        rel as any
      );
      if (!fields) continue;
      for (const field of fields as []) {
        selectFields.add(`${currentIncludeAlias.toString()}.${field}`);
      }
    }
  }

  const resultQuery = this.repository
    .createQueryBuilder()
    .orderBy(defaultSortObject);

  if (selectFields.size > 0) {
    resultQuery.select([...selectFields]);
  }

  resultQuery.whereInIds(ids);
  for (const expressionItem of expressionArrayForRelation) {
    const { selectInclude, alias, paramsForResult, params, expression } =
      expressionItem;
    if (paramsForResult) {
      for (const item of paramsForResult) {
        resultQuery.andWhere(item);
      }
    } else {
      resultQuery.andWhere(`${alias} ${expression}`);
    }

    if (params) {
      if (Array.isArray(params)) {
        for (const item of params) {
          resultQuery.setParameters({ [item.name]: item.val });
        }
      } else {
        resultQuery.setParameters({ [params.name]: params.val });
      }
    }
    if (selectInclude) includeRel.add(selectInclude);
  }

  for (const item of [...includeRel]) {
    const currentIncludeAlias = this.typeormUtilsService.getAliasForRelation(
      item as any
    );
    if (!currentIncludeAlias) continue;
    resultQuery[selectFields.size > 0 ? 'leftJoin' : 'leftJoinAndSelect'](
      this.typeormUtilsService.getAliasPath(item),
      currentIncludeAlias
    );
  }
  const resultData = await resultQuery.getMany();
  const { included, data } = this.transformDataService.transformData(
    resultData,
    query
  );
  return {
    meta: {
      pageNumber: page.number,
      totalItems: count,
      pageSize: page.size,
    },
    data,
    ...(included ? { included } : {}),
  };
}
