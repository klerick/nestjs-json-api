import { QueryFlag, serialize, wrap } from '@mikro-orm/core';

import { ObjectLiteral } from '../../../../types';
import { MicroOrmService } from '../../service';
import { Query } from '../../../mixin/zod';
import { getQueryForCount, getSortObject } from './get-query-for-count';

export async function getAll<E extends ObjectLiteral>(
  this: MicroOrmService<E>,
  query: Query<E>
): Promise<{
  totalItems: number;
  items: E[];
}> {
  const { page } = query;
  const countSubQuery = getQueryForCount.call<
    MicroOrmService<E>,
    Parameters<typeof getQueryForCount<E>>,
    ReturnType<typeof getQueryForCount<E>>
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
    .prePareQueryBuilder(resultQueryBuilder, query)
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
