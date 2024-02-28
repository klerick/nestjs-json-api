import {
  Entity,
  TypeormServiceObject,
  EntityRelation,
} from '../../../../types';

import { PostRelationshipData } from '../../../zod';

export async function deleteRelationship<
  E extends Entity,
  Rel extends EntityRelation<E>
>(
  this: TypeormServiceObject<E>,
  id: number | string,
  rel: Rel,
  input: PostRelationshipData
): Promise<void> {
  const idsResult = await this.typeormUtilsService.validateRelationInputData(
    rel,
    input
  );
  const postBuilder = this.repository
    .createQueryBuilder()
    .relation(rel.toString())
    .of(id);

  if (Array.isArray(idsResult)) {
    await postBuilder.remove(idsResult);
  } else {
    await postBuilder.set(null);
  }
  return void 0;
}
