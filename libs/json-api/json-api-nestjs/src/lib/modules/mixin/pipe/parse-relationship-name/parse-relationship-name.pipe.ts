import {
  PipeTransform,
  UnprocessableEntityException,
  Inject,
} from '@nestjs/common';
import { EntityRelation } from '@klerick/json-api-nestjs-shared';
import { ValidateQueryError } from '../../../../types';
import { CHECK_RELATION_NAME, CURRENT_ENTITY } from '../../../../constants';
import { EntityTarget, ObjectLiteral } from '../../../../types';
import { CheckRelationNme } from '../../types';
import { getEntityName } from '../../helper';

export class ParseRelationshipNamePipe<
  E extends ObjectLiteral,
  I extends EntityRelation<E>
> implements PipeTransform<string, I>
{
  @Inject(CURRENT_ENTITY) private currentEntity!: EntityTarget<E>;
  @Inject(CHECK_RELATION_NAME) private checkRelationName!: CheckRelationNme<E>;

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
