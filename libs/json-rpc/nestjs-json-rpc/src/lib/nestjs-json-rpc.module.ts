import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { JsonRpcConfig, TransportType } from './types';
import {
  HttpTransportModule,
  UtilModule,
  WsSocketTransportModule,
} from './modules';

@Module({
  controllers: [],
  providers: [],
  exports: [],
})
export class NestjsJsonRpcModule {
  static forRootAsync(options: JsonRpcConfig): DynamicModule {
    const providers: Provider[] = [];
    const { transport } = options;
    switch (options.transport) {
      case TransportType.HTTP: {
        const httpModule = HttpTransportModule.forRoot(providers, [UtilModule]);
        return {
          module: NestjsJsonRpcModule,
          imports: [
            ...(options.imports || []),
            httpModule,
            RouterModule.register([
              {
                path: options.path,
                module: HttpTransportModule,
              },
            ]),
          ],
          exports: [httpModule],
        };
      }
      case TransportType.WS: {
        const wsModule = WsSocketTransportModule.forRoot(
          options.wsConfig,
          providers,
          [UtilModule]
        );
        return {
          module: NestjsJsonRpcModule,
          imports: [...(options.imports || []), wsModule],
          exports: [wsModule],
        };
      }
      default: {
        throw new Error(`Transport ${transport} not implement`);
      }
    }
  }
}
