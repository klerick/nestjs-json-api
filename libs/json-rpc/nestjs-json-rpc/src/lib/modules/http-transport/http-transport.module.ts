import { DynamicModule, Provider } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { ForwardReference } from '@nestjs/common/interfaces/modules/forward-reference.interface';

import { JsonRpcController } from './controllers/json-rpc.controller';

export class HttpTransportModule {
  static forRoot(
    providers: Provider[],
    imports: Array<
      Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
    > = []
  ): DynamicModule {
    return {
      module: HttpTransportModule,
      providers,
      controllers: [JsonRpcController],
      // exports: [RPC_CONTEXT],
      imports,
    };
  }
}
