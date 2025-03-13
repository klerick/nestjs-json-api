import { NotFoundException } from '@nestjs/common';
import { RelationKeys } from '@klerick/json-api-nestjs-shared';
import {
  ValidateQueryError,
  PostRelationshipData,
} from '@klerick/json-api-nestjs';

import { MicroOrmService } from '../../service';

export async function deleteRelationship<
  E extends object,
  IdKey extends string,
  Rel extends RelationKeys<E, IdKey>
>(
  this: MicroOrmService<E, IdKey>,
  id: number | string,
  rel: Rel,
  input: PostRelationshipData
): Promise<void> {
  const idsResult = await this.microOrmUtilService.validateRelationInputData(
    rel as any,
    input
  );
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
    (currentEntityRef[rel] as any).remove(...relRef);
  } else {
    if (
      // @ts-ignore
      currentEntityRef[rel][this.microOrmUtilService.getPrimaryNameFor(rel)] ==
      idsResult
    ) {
      // @ts-ignore
      currentEntityRef[rel] = null;
    }
  }

  await this.microOrmUtilService.entityManager.flush();
}
