import { BadRequestException, Inject, PipeTransform } from '@nestjs/common';
import { CONTROLLER_OPTIONS_TOKEN } from '../../../../constants';
import { ValidateQueryError } from '../../../../types';
import { Query } from '../../zod';
import { EntityControllerParam } from '../../types';

export class QueryCheckSelectField<E extends object>
  implements PipeTransform<Query<E, 'id'>, Query<E, 'id'>>
{
  @Inject(CONTROLLER_OPTIONS_TOKEN) private configParam!: EntityControllerParam;
  transform(value: Query<E, 'id'>): Query<E, 'id'> {
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
