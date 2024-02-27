import { DeepPartial, Equal } from 'typeorm';
import {
  Entity,
  ResourceObject,
  TypeormServiceObject,
} from '../../../../types';
import { PostData } from '../../../zod';
import { RelationshipsResult } from '../../../../mixin/service';
import { ObjectTyped } from '../../../utils';

export async function postOne<E extends Entity>(
  this: TypeormServiceObject<E>,
  inputData: PostData<E>
): Promise<ResourceObject<E>> {
  const { attributes, relationships } = inputData;

  const entityTarget = this.repository.manager.create(
    this.repository.target,
    attributes as DeepPartial<E>
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
