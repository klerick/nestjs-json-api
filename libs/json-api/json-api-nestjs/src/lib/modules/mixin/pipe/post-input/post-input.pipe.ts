import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { errorMap } from 'zod-validation-error';

import { PostData, ZodPost } from '../../zod';
import { ZOD_POST_SCHEMA } from '../../../../constants';
import { ObjectLiteral } from '../../../../types';
import { JSONValue } from '../../types';

export class PostInputPipe<E extends ObjectLiteral>
  implements PipeTransform<JSONValue, PostData<E>>
{
  @Inject(ZOD_POST_SCHEMA) private zodInputPostSchema!: ZodPost<E, 'id'>;
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
