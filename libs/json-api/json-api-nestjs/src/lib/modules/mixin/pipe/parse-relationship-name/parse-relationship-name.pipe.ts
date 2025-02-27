import {
  PipeTransform,
  UnprocessableEntityException,
  Inject,
} from '@nestjs/common';

import { EntityParam, ValidateQueryError } from '../../../../types';
import { CHECK_RELATION_NAME, CURRENT_ENTITY } from '../../../../constants';
import { EntityClass } from '../../../../types';
import { CheckRelationName } from '../../types';

import { getEntityName } from '@klerick/json-api-nestjs-shared';

export class ParseRelationshipNamePipe<
  E extends object,
  I extends keyof EntityParam<E, 'id'>['relationProperty']
> implements PipeTransform<string, I>
{
  @Inject(CURRENT_ENTITY) private currentEntity!: EntityClass<E>;
  @Inject(CHECK_RELATION_NAME) private checkRelationName!: CheckRelationName<E>;

  transform(value: string): I {
    if (!this.checkRelationName || typeof this.checkRelationName !== 'function')
      return value as I;

    const result = this.checkRelationName(this.currentEntity, value);
    if (!result) {
      const error: ValidateQueryError = {
        code: 'invalid_arguments',
        message: `Relation '${value}' does not exist in resource '${getEntityName(
          this.currentEntity
        )}'`,
        path: [],
      };
      throw new UnprocessableEntityException([error]);
    }
    return value as I;
  }
}
