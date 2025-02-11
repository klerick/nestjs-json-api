import { DeepPartial } from 'typeorm';
import { QueryField, ResourceObject } from '@klerick/json-api-nestjs-shared';
import { ObjectLiteral } from '../../../../types';
import { PostData, Query } from '../../../mixin/zod';
import { TypeOrmService } from '../../service';

export async function postOne<E extends ObjectLiteral>(
  this: TypeOrmService<E>,
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
  const fakeQuery: Query<E> = {
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
