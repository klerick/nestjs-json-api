import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';

import { PostData, ZodPost } from '../../zod';
import {
  CONTROLLER_OPTIONS_TOKEN,
  ZOD_POST_SCHEMA,
} from '../../../../constants';
import { EntityControllerParam, JSONValue } from '../../types';

export class PostInputPipe<E extends object>
  implements PipeTransform<JSONValue, PostData<E, 'id'>>
{
  @Inject(ZOD_POST_SCHEMA) private zodInputPostSchema!: ZodPost<E, 'id'>;
  @Inject(CONTROLLER_OPTIONS_TOKEN) private controllerParams!: EntityControllerParam;
  transform(value: JSONValue): PostData<E, 'id'> {
    try {
      const result = this.zodInputPostSchema.parse(value)['data'] as PostData<E, 'id'>;
      if (!this.controllerParams.allowSetId) {
        delete result.id;
      }
      return result;
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.issues);
      }

      throw new InternalServerErrorException(e);
    }
  }
}
