import { QueryFlag, wrap } from '@mikro-orm/core';
import { Query } from '@klerick/json-api-nestjs';
import { MicroOrmService } from '../../service';

import { getQueryForCount, getSortObject } from './get-query-for-count';

export async function getAll<E extends object, IdKey extends string>(
  this: MicroOrmService<E, IdKey>,
  query: Query<E, IdKey>
): Promise<{
  totalItems: number;
  items: E[];
}> {
  const { page } = query;
  const countSubQuery = getQueryForCount.call<
    MicroOrmService<E, IdKey>,
    Parameters<typeof getQueryForCount<E, IdKey>>,
    ReturnType<typeof getQueryForCount<E, IdKey>>
  >(this, ...[query]);

  const skip = (page.number - 1) * page.size;
  const paginationQuery = countSubQuery
    .clone()
    .select(this.microOrmUtilService.currentPrimaryColumn)
    .limit(page.size, skip);

  const collectIdsAlias = 'CollectIds';

  const queryIdsQuery = this.microOrmUtilService
    .queryBuilder(collectIdsAlias)
    .select(this.microOrmUtilService.currentPrimaryColumn)
    .join(paginationQuery, this.microOrmUtilService.currentAlias, {
      [`${collectIdsAlias}.${this.microOrmUtilService.currentPrimaryColumn}`]:
        this.microOrmUtilService
          .getKnex()
          .ref(
            `${this.microOrmUtilService.currentAlias}.${this.microOrmUtilService.currentPrimaryColumn}`
          ),
    });

  const queryCount = this.microOrmUtilService
    .queryBuilder()
    .from(
      countSubQuery
        .clone()
        .select(this.microOrmUtilService.currentPrimaryColumn)
    )
    .count(this.microOrmUtilService.currentPrimaryColumn, true);

  const resCount = await queryCount.execute('get');
  const count = resCount ? +resCount.count : 0;

  if (count === 0) {
    return {
      totalItems: count,
      items: [],
    };
  }

  const resIds = await queryIdsQuery
    .distinct()
    .setFlag(QueryFlag.DISABLE_PAGINATE)
    .execute('all');

  const idsArray = resIds.map(
    (r) => r[this.microOrmUtilService.currentPrimaryColumn]
  );
  const resultQueryBuilder = this.microOrmUtilService.queryBuilder().where({
    [this.microOrmUtilService.currentPrimaryColumn]: {
      $in: idsArray,
    },
  });

  const sortObject = getSortObject(query);
  const resultList = await this.microOrmUtilService
    .prePareQueryBuilder(resultQueryBuilder, query as any)
    .orderBy(
      Object.keys(sortObject).length > 0
        ? sortObject
        : {
            [this.microOrmUtilService.currentPrimaryColumn]: 'ASC',
          }
    )
    .getResult();

  return {
    totalItems: count,
    items: resultList.map((i) => wrap(i).toJSON() as E),
  };
}
