import { ObjectLiteral } from '../../../../types';
import { MicroOrmService } from '../../service';
import { PostData } from '../../../mixin/zod';

export async function postOne<E extends ObjectLiteral>(
  this: MicroOrmService<E>,
  inputData: PostData<E>
): Promise<E> {
  const { attributes, relationships, id } = inputData;

  const idObject = id
    ? { [this.microOrmUtilService.currentPrimaryColumn.toString()]: id }
    : {};

  const attributesObject = {
    ...attributes,
    ...idObject,
  };

  const entityIns = this.microOrmUtilService.createEntity(attributesObject);

  return this.microOrmUtilService.saveEntity(entityIns, relationships);
}
