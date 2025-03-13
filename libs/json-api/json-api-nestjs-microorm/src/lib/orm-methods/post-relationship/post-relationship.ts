import { RelationKeys } from '@klerick/json-api-nestjs-shared';
import { PostRelationshipData } from '@klerick/json-api-nestjs';
import { getRelationship } from '../get-relationship/get-relationship';
import { MicroOrmService } from '../../service';

export async function postRelationship<
  E extends object,
  IdKey extends string,
  Rel extends RelationKeys<E, IdKey>
>(
  this: MicroOrmService<E, IdKey>,
  id: number | string,
  rel: Rel,
  input: PostRelationshipData
): Promise<E> {
  const idsResult = await this.microOrmUtilService.validateRelationInputData(
    rel as any,
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
    // @ts-ignore
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
    MicroOrmService<E, IdKey>,
    Parameters<typeof getRelationship<E, IdKey, Rel>>,
    ReturnType<typeof getRelationship<E, IdKey, Rel>>
  >(this, id, rel);
}
