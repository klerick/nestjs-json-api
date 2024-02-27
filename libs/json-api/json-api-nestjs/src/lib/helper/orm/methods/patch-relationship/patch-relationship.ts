import {
  Entity,
  TypeormServiceObject,
  EntityRelation,
  ResourceObjectRelationships,
} from '../../../../types';

import { PatchRelationshipData } from '../../../zod';
import { getRelationship } from '../get-relationship/get-relationship';

export async function patchRelationship<
  E extends Entity,
  Rel extends EntityRelation<E>
>(
  this: TypeormServiceObject<E>,
  id: number | string,
  rel: Rel,
  input: PatchRelationshipData
): Promise<ResourceObjectRelationships<E, Rel>> {
  const idsResult = await this.typeormUtilsService.validateRelationInputData(
    rel,
    input
  );

  const patchBuilder = this.repository
    .createQueryBuilder()
    .relation(rel.toString())
    .of(id);

  if (Array.isArray(idsResult)) {
    const data = await getRelationship.call<
      TypeormServiceObject<E>,
      [number | string, Rel],
      Promise<ResourceObjectRelationships<E, Rel>>
    >(this, id, rel);
    const idsToDelete = Array.isArray(data.data)
      ? data.data.map((i) => i.id)
      : [];

    await patchBuilder.addAndRemove(idsResult, idsToDelete);
  } else {
    await patchBuilder.set(idsResult);
  }

  return getRelationship.call<
    TypeormServiceObject<E>,
    [number | string, Rel],
    Promise<ResourceObjectRelationships<E, Rel>>
  >(this, id, rel);
}
