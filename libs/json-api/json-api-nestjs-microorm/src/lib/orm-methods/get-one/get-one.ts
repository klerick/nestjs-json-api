import { NotFoundException } from '@nestjs/common';
import { QueryOne, ValidateQueryError } from '@klerick/json-api-nestjs';
import { wrap } from '@mikro-orm/core';
import { MicroOrmService } from '../../service';

export async function getOne<E extends object, IdKey extends string>(
  this: MicroOrmService<E, IdKey>,
  id: number | string,
  query: QueryOne<E, IdKey>
): Promise<E> {
  const queryBuilder = this.microOrmUtilService.queryBuilder().where({
    [this.microOrmUtilService.currentPrimaryColumn]: id,
  });

  const resultItem = await this.microOrmUtilService
    .prePareQueryBuilder(queryBuilder, query as any)
    .getSingleResult();

  if (!resultItem) {
    const error: ValidateQueryError = {
      code: 'invalid_arguments',
      message: `Resource '${this.microOrmUtilService.currentAlias}' with id '${id}' does not exist`,
      path: ['fields'],
    };
    throw new NotFoundException([error]);
  }

  return wrap(resultItem).toJSON() as E;
}
