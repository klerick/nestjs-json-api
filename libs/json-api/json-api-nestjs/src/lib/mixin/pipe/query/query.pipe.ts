import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';

import { InputQuery, Query, QueryField, ZodQuerySchema } from '../../../helper';
import { Entity, JSONValue } from '../../../types';
import { ZOD_QUERY_SCHEMA } from '../../../constants';
import { TransformInputService } from '../../../service';

export class QueryPipe<E extends Entity>
  implements PipeTransform<InputQuery<E>, Query<E>>
{
  @Inject(ZOD_QUERY_SCHEMA)
  private zodQuerySchema!: ZodQuerySchema<E>;

  @Inject(TransformInputService)
  private transformInputService!: TransformInputService<E>;

  transform(value: InputQuery<E>): Query<E> {
    try {
      const { filter, page, sort, include, fields } = value;
      const queryObject: JSONValue = {
        [QueryField.filter]: this.transformInputService.transformFilter(filter),
        [QueryField.fields]: this.transformInputService.transformFields(fields),
        [QueryField.include]:
          this.transformInputService.transformInclude(include),
        [QueryField.sort]: this.transformInputService.transformSort(sort),
        [QueryField.page]: page,
      };
      return this.zodQuerySchema.parse(queryObject);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.issues);
      }

      throw new InternalServerErrorException(e);
    }
  }
}
