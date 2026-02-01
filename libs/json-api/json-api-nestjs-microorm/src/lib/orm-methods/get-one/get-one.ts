import { NotFoundException } from '@nestjs/common';
import { QueryOne, ValidateQueryError } from '@klerick/json-api-nestjs';
import { wrap } from '@mikro-orm/core';
import { MicroOrmService } from '../../service';

export async function getOne<E extends object, IdKey extends string>(
  this: MicroOrmService<E, IdKey>,
  id: number | string,
  query: QueryOne<E, IdKey>,
  additionalQueryParams?: Record<string, unknown>
): Promise<E> {
  const { include, fields } = query;
  const primaryColumn = this.microOrmUtilService.currentPrimaryColumn;

  // Simple query: no fields selection, no additional params
  // Use em.findOne() which leverages Identity Map and loads only missing relations
  const canUseFindOne = !fields && !additionalQueryParams;

  let resultItem: E | null;
  if (canUseFindOne) {
    const em = this.microOrmUtilService.entityManager;

    resultItem = await em.findOne(
      this.microOrmUtilService.entity,
      { [primaryColumn]: id } as any,
      { populate: (include || []) as any }
    );
  } else {
    const queryBuilder = this.microOrmUtilService.queryBuilder().where({
      [primaryColumn]: id,
    });

    const resultQueryBuilder = this.microOrmUtilService.prePareQueryBuilder(
      queryBuilder,
      query as any
    );

    if (additionalQueryParams) {
      resultQueryBuilder.andWhere(additionalQueryParams);
    }

    await resultQueryBuilder.applyFilters();

    resultItem = await resultQueryBuilder.getSingleResult();
  }

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
