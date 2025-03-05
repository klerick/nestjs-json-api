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
    let WebSocketInst: WebSocket;
    let argumentsHost: ArgumentsHost;
    let getClient: () => WebSocket;

    beforeAll(async () => {
      WebSocketInst = new WebSocket(
        'wss://demo.piesocket.com/v3/channel_123',
        {}
      );

      await new Promise((resolve) => {
        WebSocketInst.addEventListener('open', (event) => resolve(void 0));
      });

      getClient = () => WebSocketInst;
      argumentsHost = {
        switchToWs(): WsArgumentsHost {
          return {
            getClient,
          } as any;
        },
      } as any;
      WebSocketInst.onopen = () => console.log('open');
    });

    afterAll(() => {
      WebSocketInst.close();
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

    beforeAll(() => {
      getClient = () => WebSocketInst;
      argumentsHost = {
        switchToWs(): WsArgumentsHost {
          return {
            getClient,
          } as any;
        },
      } as any;
    });

    afterAll(() => {
      WebSocketInst.disconnect();
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
