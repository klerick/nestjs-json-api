import { Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { MAP_HANDLER } from '../../constants';
import { mapHandlerStoreProvider, AsyncIterate } from '../../providers';

import { HandlerService, ExplorerService } from './service';
import { ModuleRef } from '@nestjs/core';
import { zodInputDataProvider } from '../../providers/zod-input-data.provider';

@Module({
  controllers: [],
  providers: [
    mapHandlerStoreProvider,
    HandlerService,
    ExplorerService,
    AsyncIterate,
    zodInputDataProvider,
  ],
  exports: [mapHandlerStoreProvider, HandlerService, AsyncIterate],
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
