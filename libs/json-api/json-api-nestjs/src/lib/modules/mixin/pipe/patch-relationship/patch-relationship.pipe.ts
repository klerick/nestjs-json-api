import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { errorMap } from 'zod-validation-error';

import { JSONValue } from '../../types';
import { PatchRelationshipData, ZodPatchRelationship } from '../../zod';
import { ZOD_PATCH_RELATIONSHIP_SCHEMA } from '../../../../constants';

export class PatchRelationshipPipe
  implements PipeTransform<JSONValue, PatchRelationshipData>
{
  @Inject(ZOD_PATCH_RELATIONSHIP_SCHEMA)
  private zodInputPatchRelationshipSchema!: ZodPatchRelationship;
  transform(value: JSONValue): PatchRelationshipData {
    try {
      return this.zodInputPatchRelationshipSchema.parse(value, {
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
