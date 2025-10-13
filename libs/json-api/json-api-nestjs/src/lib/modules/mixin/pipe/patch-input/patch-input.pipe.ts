import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';

import { JSONValue } from '../../types';
import { PatchData, ZodPatch } from '../../zod';
import { ZOD_PATCH_SCHEMA } from '../../../../constants';

export class PatchInputPipe<E extends object>
  implements PipeTransform<JSONValue, PatchData<E, 'id'>>
{
  @Inject(ZOD_PATCH_SCHEMA)
  private zodInputPatchSchema!: ZodPatch<E, 'id'>;
  transform(value: JSONValue): PatchData<E, 'id'> {
    try {
      return this.zodInputPatchSchema.parse(value)['data'] as PatchData<E, 'id'>;
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.issues);
      }

      throw new InternalServerErrorException(e);
    }
  }
}
