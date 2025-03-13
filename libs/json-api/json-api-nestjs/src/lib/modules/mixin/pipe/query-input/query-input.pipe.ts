import {
  Inject,
  PipeTransform,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { errorMap } from 'zod-validation-error';
import { ZOD_INPUT_QUERY_SCHEMA } from '../../../../constants';
import { ZodInputQuery, InputQuery } from '../../zod';
import { JSONValue } from '../../types';

export class QueryInputPipe<E extends object>
  implements PipeTransform<JSONValue, InputQuery<E, 'id'>>
{
  @Inject(ZOD_INPUT_QUERY_SCHEMA)
  private zodInputQuerySchema!: ZodInputQuery<E, 'id'>;

  transform(value: JSONValue): InputQuery<E, 'id'> {
    try {
      return this.zodInputQuerySchema.parse(value, {
        errorMap: errorMap,
      });
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.issues);
      }

      throw new InternalServerErrorException(e);
    }
  }
}
