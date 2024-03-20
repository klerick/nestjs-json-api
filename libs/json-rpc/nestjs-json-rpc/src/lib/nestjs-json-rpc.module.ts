import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { JsonRpcConfig, TransportType } from './types';
import { HttpTransportModule, UtilModule } from './modules';

@Module({
  controllers: [],
  providers: [],
  exports: [],
})
export class NestjsJsonRpcModule {
  static forRootAsync(options: JsonRpcConfig): DynamicModule {
    const providers: Provider[] = [];

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
      default:
        throw new Error(`Transport ${options.transport} not implement`);
    }
  }
}
