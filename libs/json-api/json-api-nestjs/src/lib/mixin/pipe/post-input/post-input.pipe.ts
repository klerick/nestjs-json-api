import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { errorMap } from 'zod-validation-error';

import { Entity, JSONValue } from '../../../types';
import { PostData, ZodInputPostSchema } from '../../../helper/zod';
import { ZOD_POST_SCHEMA } from '../../../constants';

export class PostInputPipe<E extends Entity>
  implements PipeTransform<JSONValue, PostData<E>>
{
  @Inject(ZOD_POST_SCHEMA) private zodInputPostSchema!: ZodInputPostSchema<E>;
  transform(value: JSONValue): PostData<E> {
    try {
      return this.zodInputPostSchema.parse(value, {
        errorMap: errorMap,
      })['data'] as PostData<E>;
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.issues);
      }

      throw new InternalServerErrorException(e);
    }
  }
}
