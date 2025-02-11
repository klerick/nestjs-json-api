import { EntityRelation } from '../../../../utils/nestjs-shared';

import { ObjectLiteral, ValidateQueryError } from '../../../../types';

import { PostRelationshipData } from '../../../mixin/zod';
import { MicroOrmService } from '../../service';
import { NotFoundException } from '@nestjs/common';

export async function deleteRelationship<
  E extends ObjectLiteral,
  Rel extends EntityRelation<E>
>(
  this: MicroOrmService<E>,
  id: number | string,
  rel: Rel,
  input: PostRelationshipData
): Promise<void> {
  const idsResult = await this.microOrmUtilService.validateRelationInputData(
    rel,
    input
  );

  // const currentEntityRef = this.microOrmUtilService.entityManager.getReference(
  //   this.microOrmUtilService.entity,
  //   id as any
  // );

  const currentEntityRef = await this.microOrmUtilService
    .queryBuilder()
    .where({
      [this.microOrmUtilService.currentPrimaryColumn]: id,
    })
    .getSingleResult();

  if (!currentEntityRef) {
    const error: ValidateQueryError = {
      code: 'invalid_arguments',
      message: `Resource '${this.microOrmUtilService.currentAlias}' with id '${id}' does not exist`,
      path: ['fields'],
    };
    throw new NotFoundException([error]);
  }

  await this.microOrmUtilService.entityManager.populate(currentEntityRef, [
    rel as any,
  ]);

  if (Array.isArray(idsResult)) {
    const relEntity = this.microOrmUtilService.getRelation(rel as any).entity();
    const relRef = idsResult.map((i) =>
      this.microOrmUtilService.entityManager.getReference(relEntity, i as any)
    );
    currentEntityRef[rel].remove(...relRef);
  } else {
    if (
      currentEntityRef[rel][this.microOrmUtilService.getPrimaryNameFor(rel)] ==
      idsResult
    ) {
      // @ts-ignore
      currentEntityRef[rel] = null;
    }
  }

  await this.microOrmUtilService.entityManager.flush();
}
