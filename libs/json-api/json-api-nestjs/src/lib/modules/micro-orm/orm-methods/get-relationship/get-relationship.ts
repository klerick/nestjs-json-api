import { EntityRelation } from '@klerick/json-api-nestjs-shared';
import { NotFoundException } from '@nestjs/common';

import { MicroOrmService } from '../../service';
import { ObjectLiteral, ValidateQueryError } from '../../../../types';
import { serialize } from '@mikro-orm/core';

export async function getRelationship<
  E extends ObjectLiteral,
  Rel extends EntityRelation<E>
>(this: MicroOrmService<E>, id: number | string, rel: Rel): Promise<E> {
  const result = await this.microOrmUtilService
    .queryBuilder()
    .leftJoinAndSelect(
      `${this.microOrmUtilService.currentAlias}.${rel.toString()}`,
      rel.toString(),
      {},
      [this.microOrmUtilService.getPrimaryNameFor(rel)]
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
