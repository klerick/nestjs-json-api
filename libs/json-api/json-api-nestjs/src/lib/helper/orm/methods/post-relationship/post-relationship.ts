import {
  Entity,
  TypeormServiceObject,
  EntityRelation,
  ResourceObjectRelationships,
} from '../../../../types';

import { PostRelationshipData } from '../../../zod';
import { getRelationship } from '../get-relationship/get-relationship';

export async function postRelationship<
  E extends Entity,
  Rel extends EntityRelation<E>
>(
  this: TypeormServiceObject<E>,
  id: number | string,
  rel: Rel,
  input: PostRelationshipData
): Promise<ResourceObjectRelationships<E, Rel>> {
  const idsResult = await this.typeormUtilsService.validateRelationInputData(
    rel,
    input
  );
  const postBuilder = this.repository
    .createQueryBuilder()
    .relation(rel.toString())
    .of(id);

  if (Array.isArray(idsResult)) {
    await postBuilder.add(idsResult);
  } else {
    await postBuilder.set(idsResult);
  }

  return getRelationship.call<
    TypeormServiceObject<E>,
    [number | string, Rel],
    Promise<ResourceObjectRelationships<E, Rel>>
  >(this, id, rel);
}
