import {
  EntityRelation,
  ResourceObjectRelationships,
} from '../../../../utils/nestjs-shared';

import { ObjectLiteral } from '../../../../types';
import { PostRelationshipData } from '../../../mixin/zod';
import { getRelationship } from '../get-relationship/get-relationship';
import { TypeOrmService } from '../../service';

export async function postRelationship<
  E extends ObjectLiteral,
  Rel extends EntityRelation<E>
>(
  this: TypeOrmService<E>,
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
    TypeOrmService<E>,
    [number | string, Rel],
    Promise<ResourceObjectRelationships<E, Rel>>
  >(this, id, rel);
}
