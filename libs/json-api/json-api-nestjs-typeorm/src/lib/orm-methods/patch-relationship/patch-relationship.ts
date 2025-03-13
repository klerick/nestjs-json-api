import { PatchRelationshipData } from '@klerick/json-api-nestjs';
import {
  RelationKeys,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';

import { getRelationship } from '../get-relationship/get-relationship';
import { TypeOrmService } from '../../service';

export async function patchRelationship<
  E extends object,
  IdKey extends string,
  Rel extends RelationKeys<E, IdKey>
>(
  this: TypeOrmService<E, IdKey>,
  id: number | string,
  rel: Rel,
  input: PatchRelationshipData
): Promise<ResourceObjectRelationships<E, IdKey, Rel>> {
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
      TypeOrmService<E, IdKey>,
      [number | string, Rel],
      Promise<ResourceObjectRelationships<E, IdKey, Rel>>
    >(this, id, rel);
    const idsToDelete = Array.isArray(data.data)
      ? data.data.map((i) => i.id)
      : [];

    await patchBuilder.addAndRemove(idsResult, idsToDelete);
  } else {
    await patchBuilder.set(idsResult);
  }

  return getRelationship.call<
    TypeOrmService<E, IdKey>,
    [number | string, Rel],
    Promise<ResourceObjectRelationships<E, IdKey, Rel>>
  >(this, id, rel);
}
