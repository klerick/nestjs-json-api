import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';

import { ZodMetaExtractor } from '../../zod';
import { ZOD_META_SCHEMA } from '../../../../constants';
import { JSONValue } from '../../types';

export class MetaExtractorPipe
  implements PipeTransform<JSONValue, Record<string, unknown>>
{
  @Inject(ZOD_META_SCHEMA) private readonly zodMetaExtractorSchema!: ZodMetaExtractor;

  transform(value: JSONValue): Record<string, unknown> {
    try {
      return this.zodMetaExtractorSchema.parse(value);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.issues);
      }

      throw new InternalServerErrorException(e);
    }
  }
}
