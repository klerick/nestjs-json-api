import { RelationKeys } from '@klerick/json-api-nestjs-shared';
import { NotFoundException } from '@nestjs/common';
import { ValidateQueryError } from '@klerick/json-api-nestjs';
import { serialize } from '@mikro-orm/core';

import { MicroOrmService } from '../../service';

export async function getRelationship<
  E extends object,
  IdKey extends string,
  Rel extends RelationKeys<E, IdKey>
>(this: MicroOrmService<E, IdKey>, id: number | string, rel: Rel): Promise<E> {
  const result = await this.microOrmUtilService
    .queryBuilder()
    .leftJoinAndSelect(
      `${this.microOrmUtilService.currentAlias}.${rel.toString()}`,
      rel.toString(),
      {},
      [this.microOrmUtilService.getPrimaryNameFor(rel as any)]
    )
    .where({
      [this.microOrmUtilService.currentPrimaryColumn]: id,
    })
    .getSingleResult();

  if (!result) {
    const error: ValidateQueryError = {
      code: 'invalid_arguments',
      message: `Resource '${this.microOrmUtilService.currentAlias}' with id '${id}' does not exist`,
      path: ['fields'],
    };
    throw new NotFoundException([error]);
  }

  return serialize(result, { forceObject: true }) as unknown as E;
}
