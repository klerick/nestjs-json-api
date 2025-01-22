import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { errorMap } from 'zod-validation-error';

import { JSONValue } from '../../types';
import { PatchData, ZodPatch } from '../../zod';
import { ZOD_PATCH_SCHEMA } from '../../../../constants';
import { ObjectLiteral } from '../../../../types';

export class PatchInputPipe<E extends ObjectLiteral>
  implements PipeTransform<JSONValue, PatchData<E>>
{
  @Inject(ZOD_PATCH_SCHEMA)
  private zodInputPatchSchema!: ZodPatch<E, 'id'>;
  transform(value: JSONValue): PatchData<E> {
    try {
      return this.zodInputPatchSchema.parse(value, {
        errorMap: errorMap,
      })['data'] as PatchData<E>;
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.issues);
      }

      throw new InternalServerErrorException(e);
    }
  }
}
