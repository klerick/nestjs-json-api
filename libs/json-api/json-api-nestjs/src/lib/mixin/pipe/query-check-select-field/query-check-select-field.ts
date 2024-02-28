import { BadRequestException, Inject, PipeTransform } from '@nestjs/common';
import { CONTROL_OPTIONS_TOKEN } from '../../../constants';
import { ConfigParam, Entity, ValidateQueryError } from '../../../types';
import { Query } from '../../../helper';

export class QueryCheckSelectField<E extends Entity>
  implements PipeTransform<Query<E>, Query<E>>
{
  @Inject(CONTROL_OPTIONS_TOKEN) private configParam!: ConfigParam;
  transform(value: Query<E>): Query<E> {
    if (this.configParam.requiredSelectField && value.fields === null) {
      const error: ValidateQueryError = {
        code: 'invalid_arguments',
        message: `Fields params in query is required'`,
        path: ['fields'],
      };
      throw new BadRequestException([error]);
    }
    return value;
  }
}
