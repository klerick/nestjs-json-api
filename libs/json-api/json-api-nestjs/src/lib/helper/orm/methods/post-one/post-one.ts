import { DeepPartial } from 'typeorm';
import {
  Entity,
  ResourceObject,
  TypeormServiceObject,
} from '../../../../types';
import { PostData } from '../../../zod';

export async function postOne<E extends Entity>(
  this: TypeormServiceObject<E>,
  inputData: PostData<E>
): Promise<ResourceObject<E>> {
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

  const { data, included } = this.transformDataService.transformData(saveData);
  const includeData = included ? { included } : {};
  return {
    meta: {},
    data,
    ...includeData,
  };
}
