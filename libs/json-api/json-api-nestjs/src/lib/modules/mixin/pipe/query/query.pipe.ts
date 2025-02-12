import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';

import { ZOD_QUERY_SCHEMA } from '../../../../constants';
import { ZodQuery, Query, InputQuery } from '../../zod';
import { ObjectLiteral } from '../../../../types';

export class QueryPipe<E extends ObjectLiteral>
  implements PipeTransform<InputQuery<E>, Query<E>>
{
  @Inject(ZOD_QUERY_SCHEMA)
  private zodQuerySchema!: ZodQuery<E>;

  transform(value: InputQuery<E>): Query<E> {
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
