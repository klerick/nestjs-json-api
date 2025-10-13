import { PostData } from '@klerick/json-api-nestjs';
import { EntityData } from '@mikro-orm/core';

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
  } as unknown as EntityData<E>;

  const entityIns = this.microOrmUtilService.createEntity(attributesObject);

  return this.microOrmUtilService.saveEntity(entityIns, relationships);
}
