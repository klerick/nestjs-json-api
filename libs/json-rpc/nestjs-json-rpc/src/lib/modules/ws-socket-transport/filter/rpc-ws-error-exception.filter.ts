import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { WebSocket } from 'ws';
import { Socket } from 'socket.io';

import { getBodyError } from '../../../utils';
import { WS_EVENT_NAME } from '../constants';

@Catch()
export class RpcWsErrorExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const body = getBodyError(exception);
    const client = host.switchToWs().getClient<WebSocket | Socket>();
    if (client instanceof WebSocket) {
      client.send(JSON.stringify({ event: WS_EVENT_NAME, data: body }));
    } else {
      client.emit(WS_EVENT_NAME, body);
    }
  }
}
