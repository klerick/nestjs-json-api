import { Inject, Injectable, PipeTransform } from '@nestjs/common';

import { ZOD_INPUT_DATA } from '../../../constants';
import {
  ZodPayloadRpc,
  ErrorCodeType,
  PayloadRpcArray,
  PayloadRpc,
} from '../../../types';
import { createError, RpcError } from '../../../utils';

@Injectable()
export class InputDataPipe
  implements PipeTransform<unknown, PayloadRpcArray | PayloadRpc>
{
  @Inject(ZOD_INPUT_DATA) zodInputData!: ZodPayloadRpc;

  transform(value: unknown): PayloadRpcArray | PayloadRpc {
    if (Array.isArray(value)) {
      const resultValue: PayloadRpcArray = [];
      for (const item of value) {
        try {
          resultValue.push(this.zodInputData.parse(item));
        } catch (e) {
          throw this.getError(item);
        }
      }
      return resultValue;
    } else {
      try {
        return this.zodInputData.parse(value);
      } catch (e) {
        throw this.getError(value);
      }
    }
  }

  private getError(value: unknown): RpcError {
    const error = createError(ErrorCodeType.InvalidRequest);
    if (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      (typeof value['id'] === 'string' || typeof value['id'] === 'number')
    ) {
      const id = parseInt(`${value['id']}`);
      error.id = isNaN(id) ? null : id;
    }

    return error;
  }
}
