import { PostData } from '@klerick/json-api-nestjs';
import { MicroOrmService } from '../../service';

export async function postOne<E extends object, IdKey extends string>(
  this: MicroOrmService<E, IdKey>,
  inputData: PostData<E, IdKey>
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
