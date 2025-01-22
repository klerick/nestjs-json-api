import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { errorMap } from 'zod-validation-error';

import { JSONValue } from '../../types';
import { PostRelationshipData, ZodPostRelationship } from '../../zod';
import { ZOD_POST_RELATIONSHIP_SCHEMA } from '../../../../constants';

export class PostRelationshipPipe
  implements PipeTransform<JSONValue, PostRelationshipData>
{
  @Inject(ZOD_POST_RELATIONSHIP_SCHEMA)
  private zodInputPostRelationshipSchema!: ZodPostRelationship;
  transform(value: JSONValue): PostRelationshipData {
    try {
      return this.zodInputPostRelationshipSchema.parse(value, {
        errorMap: errorMap,
      })['data'];
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.issues);
      }

      throw new InternalServerErrorException(e);
    }
  }
}
