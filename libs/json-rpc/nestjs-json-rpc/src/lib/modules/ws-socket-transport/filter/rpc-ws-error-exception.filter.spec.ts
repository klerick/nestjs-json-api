import { ArgumentsHost } from '@nestjs/common';
import { WsArgumentsHost } from '@nestjs/common/interfaces/features/arguments-host.interface';
import { WebSocket } from 'ws';
import { Socket } from 'socket.io';

import { RpcWsErrorExceptionFilter } from './rpc-ws-error-exception.filter';
import { createError, fromRpcErrorToRpcErrorObject } from '../../../utils';
import { ErrorCodeType } from '../../../types';
import { WS_EVENT_NAME } from '../constants';

describe('rpc-ws-error-exception.filter', () => {
  describe('WebSocket', () => {
    const WebSocketInst = new WebSocket(
      'wss://demo.piesocket.com/v3/channel_123',
      {}
    );
    let argumentsHost: ArgumentsHost;
    let getClient: () => WebSocket;

    beforeEach(() => {
      getClient = () => WebSocketInst;
      argumentsHost = {
        switchToWs(): WsArgumentsHost {
          return {
            getClient,
          } as any;
        },
      } as any;
    });

    it('should catch RpcError and transform it to RpcErrorObject', () => {
      const filter = new RpcWsErrorExceptionFilter();
      const exception = createError(
        ErrorCodeType.InvalidRequest,
        'InvalidRequest'
      );

      const spySend = jest.spyOn(WebSocketInst, 'send').mockImplementation();
      filter.catch(exception, argumentsHost);
      expect(spySend).toHaveBeenCalledWith(
        JSON.stringify({
          event: WS_EVENT_NAME,
          data: fromRpcErrorToRpcErrorObject(exception),
        })
      );
    });

    it('should catch Error and transform it to RpcErrorObject', () => {
      const filter = new RpcWsErrorExceptionFilter();
      const exception = new Error('Test Error');
      const spySend = jest.spyOn(WebSocketInst, 'send').mockImplementation();
      filter.catch(exception, argumentsHost);
      expect(spySend).toHaveBeenCalledWith(
        JSON.stringify({
          event: WS_EVENT_NAME,
          data: fromRpcErrorToRpcErrorObject(
            createError(ErrorCodeType.ServerError, exception.message)
          ),
        })
      );
    });
  });

  describe('socket.io', () => {
    // @ts-ignore
    const WebSocketInst = new Socket(
      {
        server: { _opts: {} },
      },
      {
        conn: {
          protocol: 1,
        },
      }
    );
    let argumentsHost: ArgumentsHost;
    let getClient: () => Socket;

    beforeEach(() => {
      getClient = () => WebSocketInst;
      argumentsHost = {
        switchToWs(): WsArgumentsHost {
          return {
            getClient,
          } as any;
        },
      } as any;
    });

    it('should catch RpcError and transform it to RpcErrorObject', () => {
      const filter = new RpcWsErrorExceptionFilter();
      const exception = createError(
        ErrorCodeType.InvalidRequest,
        'InvalidRequest'
      );

      const spySend = jest.spyOn(WebSocketInst, 'emit').mockImplementation();
      filter.catch(exception, argumentsHost);
      expect(spySend).toHaveBeenCalledWith(
        WS_EVENT_NAME,
        fromRpcErrorToRpcErrorObject(exception)
      );
    });

    it('should catch Error and transform it to RpcErrorObject', () => {
      const filter = new RpcWsErrorExceptionFilter();
      const exception = new Error('Test Error');
      const spySend = jest.spyOn(WebSocketInst, 'emit').mockImplementation();
      filter.catch(exception, argumentsHost);
      expect(spySend).toHaveBeenCalledWith(
        WS_EVENT_NAME,
        fromRpcErrorToRpcErrorObject(
          createError(ErrorCodeType.ServerError, exception.message)
        )
      );
    });
  });
});
