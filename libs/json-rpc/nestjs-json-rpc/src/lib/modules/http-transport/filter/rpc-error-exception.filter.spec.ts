import { ArgumentsHost } from '@nestjs/common';

import { RpcErrorExceptionFilter } from './rpc-error-exception.filter';
import { createError, fromRpcErrorToRpcErrorObject } from '../../../utils';
import { ErrorCodeType } from '../../../types';

import { HttpArgumentsHost } from '@nestjs/common/interfaces';

describe('rpc-error-exception.filter', () => {
  let argumentsHost: ArgumentsHost;
  let response: {
    send: (arg: any) => void;
  };
  let getResponse: () => typeof response;

  beforeEach(() => {
    response = {
      send() {
        return void 0;
      },
    };
    getResponse = () => response;
    argumentsHost = {
      switchToHttp(): HttpArgumentsHost {
        return {
          getResponse,
        } as any;
      },
    } as any;
  });

  it('should catch RpcError and transform it to RpcErrorObject', () => {
    const filter = new RpcErrorExceptionFilter();
    const exception = createError(
      ErrorCodeType.InvalidRequest,
      'InvalidRequest'
    );
    const spySend = vi.spyOn(response, 'send');
    filter.catch(exception, argumentsHost);
    expect(spySend).toHaveBeenCalledWith(
      fromRpcErrorToRpcErrorObject(exception)
    );
  });

  it('should catch Error and transform it to RpcErrorObject', () => {
    const filter = new RpcErrorExceptionFilter();
    const exception = new Error('Test Error');
    const spySend = vi.spyOn(response, 'send');
    filter.catch(exception, argumentsHost);
    expect(spySend).toHaveBeenCalledWith(
      fromRpcErrorToRpcErrorObject(
        createError(ErrorCodeType.ServerError, exception.message)
      )
    );
  });
});
