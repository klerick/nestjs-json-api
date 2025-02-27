import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';

import { ZOD_QUERY_SCHEMA } from '../../../../constants';
import { ZodQuery, Query, InputQuery } from '../../zod';

export class QueryPipe<E extends object>
  implements PipeTransform<InputQuery<E, 'id'>, Query<E, 'id'>>
{
  @Inject(ZOD_QUERY_SCHEMA)
  private zodQuerySchema!: ZodQuery<E, 'id'>;

  transform(value: InputQuery<E, 'id'>): Query<E, 'id'> {
    try {
      return this.zodQuerySchema.parse(value);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.issues);
      }

      throw new InternalServerErrorException(e);
    }
  }
}
