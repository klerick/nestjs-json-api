import { EntityRelation } from '@klerick/json-api-nestjs-shared';

import { ObjectLiteral } from '../../../../types';

import { PostRelationshipData } from '../../../mixin/zod';
import { TypeOrmService } from '../../service';

export async function deleteRelationship<
  E extends ObjectLiteral,
  Rel extends EntityRelation<E>
>(
  this: TypeOrmService<E>,
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
