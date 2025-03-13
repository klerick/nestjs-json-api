import { Inject, NotFoundException, PipeTransform } from '@nestjs/common';
import { EntityClass, getEntityName } from '@klerick/json-api-nestjs-shared';

import { ValidateQueryError } from '../../../../types';
import { CURRENT_ENTITY, FIND_ONE_ROW_ENTITY } from '../../../../constants';
import { FindOneRowEntity } from '../../types';

export class CheckItemEntityPipe<E extends object, I extends string | number>
  implements PipeTransform<I, Promise<I>>
{
  @Inject(CURRENT_ENTITY) private currentEntity!: EntityClass<E>;
  @Inject(FIND_ONE_ROW_ENTITY) private findOneRowEntity!:
    | FindOneRowEntity<E>
    | undefined;
  async transform(value: I): Promise<I> {
    if (!this.findOneRowEntity || typeof this.findOneRowEntity !== 'function')
      return value;

    const result = await this.findOneRowEntity(this.currentEntity, value);
    if (!result) {
      const error: ValidateQueryError = {
        code: 'invalid_arguments',
        message: `Resource '${getEntityName(
          this.currentEntity
        )}' with id '${value}' does not exist`,
        path: [],
      };
      throw new NotFoundException([error]);
    }
    return value;
  }
}
