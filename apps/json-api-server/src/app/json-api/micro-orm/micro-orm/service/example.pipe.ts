import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';

import { Query } from '@klerick/json-api-nestjs';
import { Users } from '@nestjs-json-api/microorm-database';

export class ExamplePipe
  implements PipeTransform<Query<Users, 'id'>, Query<Users, 'id'>>
{
  transform(
    value: Query<Users, 'id'>,
    metadata: ArgumentMetadata
  ): Query<Users, 'id'> {
    if (value.filter.target?.firstName?.eq === 'testCustomPipe') {
      const error = {
        code: 'invalid_arguments',
        message: `Custom query pipe error`,
        path: [],
      };
      throw new BadRequestException([error]);
    }
    return value;
  }
}
