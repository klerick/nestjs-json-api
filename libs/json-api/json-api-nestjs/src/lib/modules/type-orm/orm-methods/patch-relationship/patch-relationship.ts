import {
  EntityRelation,
  ResourceObjectRelationships,
} from '@klerick/json-api-nestjs-shared';

import { ObjectLiteral } from '../../../../types';

import { PatchRelationshipData } from '../../../mixin/zod';
import { getRelationship } from '../get-relationship/get-relationship';
import { TypeOrmService } from '../../service';

export async function patchRelationship<
  E extends ObjectLiteral,
  Rel extends EntityRelation<E>
>(
  this: TypeOrmService<E>,
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
      TypeOrmService<E>,
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
    TypeOrmService<E>,
    [number | string, Rel],
    Promise<ResourceObjectRelationships<E, Rel>>
  >(this, id, rel);
}
