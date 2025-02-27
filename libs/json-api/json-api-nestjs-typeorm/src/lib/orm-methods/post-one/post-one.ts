import { PostData, Query } from '@klerick/json-api-nestjs';
import { QueryField, ResourceObject } from '@klerick/json-api-nestjs-shared';
import { DeepPartial } from 'typeorm';

import { TypeOrmService } from '../../service';

export async function postOne<E extends object, IdKey extends string>(
  this: TypeOrmService<E, IdKey>,
  inputData: PostData<E, IdKey>
): Promise<ResourceObject<E, 'object', null, IdKey>> {
  const { attributes, relationships, id } = inputData;

  const idObject = id
    ? { [this.typeormUtilsService.currentPrimaryColumn.toString()]: id }
    : {};

  const attributesObject = {
    ...attributes,
    ...idObject,
  } as DeepPartial<E>;

  const entityTarget = this.repository.manager.create(
    this.repository.target,
    attributesObject
  );

  const saveData = await this.typeormUtilsService.saveEntityData(
    entityTarget,
    relationships
  );
  const fakeQuery: Query<E, IdKey> = {
    [QueryField.fields]: null,
    [QueryField.include]: Object.keys(relationships || {}),
  } as any;

  const { data, included } = this.transformDataService.transformData(
    saveData,
    fakeQuery
  );
  const includeData = included ? { included } : {};
  return {
    meta: {},
    data,
    ...includeData,
  };
}
