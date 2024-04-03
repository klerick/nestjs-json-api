import { DynamicModule, Provider } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { ForwardReference } from '@nestjs/common/interfaces/modules/forward-reference.interface';
import { GatewayMetadata } from '@nestjs/websockets/interfaces';

import { WebSocketGatewayService } from './service';
import { createGatewayFactory } from './factory';

export class WsSocketTransportModule {
  static forRoot(
    wsConfig: GatewayMetadata,
    providers: Provider[],
    imports: Array<
      Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
    > = []
  ): DynamicModule {
    return {
      module: WsSocketTransportModule,
      providers: [
        ...providers,
        createGatewayFactory(WebSocketGatewayService, wsConfig),
      ],
      imports,
    };
  }
}
