import { EntityRelation } from '../../../../utils/nestjs-shared';

import { ObjectLiteral } from '../../../../types';
import { PostRelationshipData } from '../../../mixin/zod';
import { getRelationship } from '../get-relationship/get-relationship';
import { MicroOrmService } from '../../service';

export async function postRelationship<
  E extends ObjectLiteral,
  Rel extends EntityRelation<E>
>(
  this: MicroOrmService<E>,
  id: number | string,
  rel: Rel,
  input: PostRelationshipData
): Promise<E> {
  const idsResult = await this.microOrmUtilService.validateRelationInputData(
    rel,
    input
  );

  const currentEntityRef = this.microOrmUtilService.entityManager.getReference(
    this.microOrmUtilService.entity,
    id as any
  );

  const relEntity = this.microOrmUtilService.getRelation(rel as any).entity();

  if (Array.isArray(idsResult)) {
    const relRef = idsResult.map((i) =>
      this.microOrmUtilService.entityManager.getReference(relEntity, i as any)
    );
    currentEntityRef[rel].add(...relRef);
  } else {
    // @ts-ignore
    currentEntityRef[rel] = this.microOrmUtilService.entityManager.getReference(
      relEntity,
      idsResult as any
    );
  }

  await this.microOrmUtilService.entityManager.flush();

  return getRelationship.call<
    MicroOrmService<E>,
    Parameters<typeof getRelationship<E, Rel>>,
    ReturnType<typeof getRelationship<E, Rel>>
  >(this, id, rel);
}
