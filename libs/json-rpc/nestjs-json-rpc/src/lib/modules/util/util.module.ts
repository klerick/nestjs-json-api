import { Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MAP_HANDLER } from '../../constants';
import { mapHandlerStoreProvider, AsyncIterate } from '../../providers';

import { HandlerService, ExplorerService } from './service';
import { zodInputDataProvider } from '../../providers/zod-input-data.provider';
import { InputDataPipe } from './pipe/input-data.pipe';

@Module({
  controllers: [],
  providers: [
    mapHandlerStoreProvider,
    HandlerService,
    ExplorerService,
    AsyncIterate,
    zodInputDataProvider,
    InputDataPipe,
  ],
  exports: [
    mapHandlerStoreProvider,
    HandlerService,
    AsyncIterate,
    zodInputDataProvider,
    InputDataPipe,
  ],
})
export class UtilModule implements OnApplicationBootstrap {
  @Inject(MAP_HANDLER) private readonly mapHandler!: Map<string, unknown>;
  @Inject(ExplorerService) private readonly explorerService!: ExplorerService;
  @Inject(ModuleRef) private readonly moduleRef!: ModuleRef;

  onApplicationBootstrap() {
    const handlerList = this.explorerService.explore();
    for (const handler of handlerList) {
      const instance = this.moduleRef.get(handler, { strict: false });
      if (!instance) {
        return;
      }
      this.mapHandler.set(handler.name, instance);
    }
  }
}
