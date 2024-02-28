import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import {
  Entity,
  ResourceObject,
  TypeormServiceObject,
  ValidateQueryError,
} from '../../../../types';
import { PatchData } from '../../../zod';
import { ObjectTyped } from '../../../utils';

export async function patchOne<E extends Entity>(
  this: TypeormServiceObject<E>,
  id: number | string,
  inputData: PatchData<E>
): Promise<ResourceObject<E>> {
  const { id: idBody, attributes, relationships } = inputData;

  if (`${id}` !== idBody) {
    const error: ValidateQueryError = {
      code: 'invalid_arguments',
      message: `Data 'id' must be equal to url param`,
      path: ['data', 'id'],
    };

    throw new UnprocessableEntityException([error]);
  }

  const paramsId = 'paramsId';
  const result = await this.repository
    .createQueryBuilder()
    .where(
      `${this.typeormUtilsService.getAliasPath(
        this.typeormUtilsService.currentPrimaryColumn
      )} = :${paramsId}`,
      {
        [paramsId]: id,
      }
    )
    .getOne();

  if (!result) {
    const error: ValidateQueryError = {
      code: 'invalid_arguments',
      message: `Resource '${this.typeormUtilsService.currentAlias}' with id '${id}' does not exist`,
      path: ['data', 'id'],
    };
    throw new NotFoundException([error]);
  }

  if (attributes) {
    const entityTarget = this.repository.manager.create(
      this.repository.target,
      attributes as DeepPartial<E>
    );
    for (const [props, val] of ObjectTyped.entries(entityTarget)) {
      result[props] = val;
    }
  }

  const saveData = await this.typeormUtilsService.saveEntityData(
    result,
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
