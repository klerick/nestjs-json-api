import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

import {
  RpcError,
  fromRpcErrorToRpcErrorObject,
  createError,
} from '../../../utils';
import { RpcErrorObject, ErrorCodeType } from '../../../types';

@Catch()
export class RpcErrorExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    let body: RpcErrorObject;
    if (exception instanceof RpcError) {
      body = fromRpcErrorToRpcErrorObject(exception);
    } else {
      body = fromRpcErrorToRpcErrorObject(
        createError(ErrorCodeType.ServerError, exception.message)
      );
    }
    host.switchToHttp().getResponse().send(body);
  }
}
