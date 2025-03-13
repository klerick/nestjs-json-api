import { PostRelationshipData } from '@klerick/json-api-nestjs';
import { RelationKeys } from '@klerick/json-api-nestjs-shared';

import { TypeOrmService } from '../../service';

export async function deleteRelationship<
  E extends object,
  IdKey extends string,
  Rel extends RelationKeys<E, IdKey>
>(
  this: TypeOrmService<E, IdKey>,
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
