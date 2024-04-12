import { Inject, Injectable, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

import { JsonRpcMetadataKey } from '../../../constants';

@Injectable()
export class ExplorerService {
  @Inject(ModulesContainer)
  private readonly modulesContainer!: ModulesContainer;

  explore(): Type<any>[] {
    const modules = [...this.modulesContainer.values()];
    return modules
      .reduce(
        (acum, module) => (acum.push(...module.providers.values()), acum),
        [] as InstanceWrapper<any>[]
      )
      .map((instanceWrapper) => {
        const { instance } = instanceWrapper;
        if (!instance) {
          return undefined;
        }

        const metadata = Reflect.getMetadata(
          JsonRpcMetadataKey,
          instance.constructor
        );
        return metadata ? (instance.constructor as Type<any>) : undefined;
      })
      .filter((i): i is Type<any> => !!i);
  }
}
