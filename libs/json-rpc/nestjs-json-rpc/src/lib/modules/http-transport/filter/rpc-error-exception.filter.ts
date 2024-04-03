import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

import { getBodyError } from '../../../utils';

@Catch()
export class RpcErrorExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    host.switchToHttp().getResponse().send(getBodyError(exception));
  }
}
