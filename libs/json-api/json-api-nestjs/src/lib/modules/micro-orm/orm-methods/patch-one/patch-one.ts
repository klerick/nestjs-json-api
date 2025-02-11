import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ObjectTyped } from '@klerick/json-api-nestjs-shared';

import { ObjectLiteral, ValidateQueryError } from '../../../../types';
import { MicroOrmService } from '../../service';
import { PatchData } from '../../../mixin/zod';

export async function patchOne<E extends ObjectLiteral>(
  this: MicroOrmService<E>,
  id: number | string,
  inputData: PatchData<E>
): Promise<E> {
  const { id: idBody, attributes, relationships } = inputData;

  if (`${id}` !== idBody) {
    const error: ValidateQueryError = {
      code: 'invalid_arguments',
      message: `Data 'id' must be equal to url param`,
      path: ['data', 'id'],
    };

    throw new UnprocessableEntityException([error]);
  }

  const existEntity = await this.microOrmUtilService
    .queryBuilder()
    .where({
      [this.microOrmUtilService.currentPrimaryColumn]: id,
    })
    .getSingleResult();

  if (!existEntity) {
    const error: ValidateQueryError = {
      code: 'invalid_arguments',
      message: `Resource '${this.microOrmUtilService.currentAlias}' with id '${id}' does not exist`,
      path: ['data', 'id'],
    };
    throw new NotFoundException([error]);
  }

  if (attributes) {
    const attrTarget = this.microOrmUtilService.createEntity(attributes as any);

    for (const [props, val] of ObjectTyped.entries(attrTarget)) {
      if (!(props in attributes)) continue;
      existEntity[props] = val;
    }
  }
  return this.microOrmUtilService.saveEntity(existEntity, relationships);
}
