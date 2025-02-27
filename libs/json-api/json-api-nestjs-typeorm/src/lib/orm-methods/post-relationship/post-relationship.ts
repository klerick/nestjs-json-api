import {
  RelationKeys,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';
import { PostRelationshipData } from '@klerick/json-api-nestjs';

import { getRelationship } from '../get-relationship/get-relationship';
import { TypeOrmService } from '../../service';

export async function postRelationship<
  E extends object,
  IdKey extends string,
  Rel extends RelationKeys<E, IdKey>
>(
  this: TypeOrmService<E, IdKey>,
  id: number | string,
  rel: Rel,
  input: PostRelationshipData
): Promise<ResourceObjectRelationships<E, IdKey, Rel>> {
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
    TypeOrmService<E, IdKey>,
    [number | string, Rel],
    Promise<ResourceObjectRelationships<E, IdKey, Rel>>
  >(this, id, rel);
}
