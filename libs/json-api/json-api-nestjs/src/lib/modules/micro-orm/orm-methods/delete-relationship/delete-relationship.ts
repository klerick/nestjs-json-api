import { EntityRelation } from '@klerick/json-api-nestjs-shared';

import { ObjectLiteral } from '../../../../types';

import { PostRelationshipData } from '../../../mixin/zod';
import { MicroOrmService } from '../../service';

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

  const currentEntityRef = this.microOrmUtilService.entityManager.getReference(
    this.microOrmUtilService.entity,
    id as any
  );

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
