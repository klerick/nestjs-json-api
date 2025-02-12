import {
  InternalServerErrorException,
  BadRequestException,
  Inject,
  PipeTransform,
} from '@nestjs/common';
import { errorMap } from 'zod-validation-error';
import { ZodError } from 'zod';
import { JSONValue } from '../../mixin/types';
import { InputArray, ZodInputOperation } from '../utils';
import { KEY_MAIN_INPUT_SCHEMA, ZOD_INPUT_OPERATION } from '../constants';

export class InputOperationPipe
  implements PipeTransform<JSONValue, InputArray>
{
  @Inject(ZOD_INPUT_OPERATION)
  private zodInputOperation!: ZodInputOperation<any>;

  transform(value: JSONValue): InputArray {
    try {
      return this.zodInputOperation.parse(value, {
        errorMap: errorMap,
      })[KEY_MAIN_INPUT_SCHEMA];
    } catch (e) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.issues);
      }

      throw new InternalServerErrorException(e);
    }
  }
}
