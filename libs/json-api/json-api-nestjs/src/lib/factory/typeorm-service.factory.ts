import { FactoryProvider } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import {
  ConfigParam,
  Entity,
  TypeormService,
  TypeormServiceObject,
} from '../types';
import {
  CONFIG_PARAM_POSTFIX,
  TYPEORM_UTILS_SERVICE_POSTFIX,
  CURRENT_DATA_SOURCE_TOKEN,
  TYPEORM_SERVICE,
  CURRENT_ENTITY_REPOSITORY,
  CONTROL_OPTIONS_TOKEN,
} from '../constants';

import {
  getEntityName,
  getProviderName,
  MethodsService,
  ObjectTyped,
} from '../helper';
import { TypeormUtilsService } from '../service';
import { TransformDataService } from '../mixin/service';

function guardMethodsServiceName<R extends typeof MethodsService>(
  methodsService: R,
  key: any
): asserts key is keyof R {
  if (!(key in methodsService))
    throw new Error(`${key} is not methode of MethodsService`);
}

export function TypeormServiceFactory<E extends Entity>(
  entity: E
): FactoryProvider<TypeormService<E>> {
  const entityName = getEntityName(entity as any);
  return {
    provide: TYPEORM_SERVICE,
    inject: [
      {
        token: CURRENT_ENTITY_REPOSITORY,
        optional: false,
      },
      {
        token: CONTROL_OPTIONS_TOKEN,
        optional: false,
      },
      TypeormUtilsService,
      TransformDataService,
    ],
    useFactory: (
      repository: Repository<E>,
      config: ConfigParam,
      typeormUtilsService: TypeormUtilsService<E>,
      transformDataService: TransformDataService<E>
    ) => {
      const typeOrmObject: TypeormServiceObject<E> = {
        repository,
        config,
        typeormUtilsService,
        transformDataService,
      };

      const bindMethods = ObjectTyped.entries(MethodsService).reduce(
        (acum, [key, val]) => ({
          ...acum,
          [key]: (val as any).bind(typeOrmObject) as typeof val,
        }),
        {} as typeof MethodsService
      );

      const target = {} as TypeormService<E>;
      return new Proxy<TypeormService<E>>(target, {
        get(target: {}, p: string | symbol, receiver: any): any {
          try {
            guardMethodsServiceName(bindMethods, p);
            return bindMethods[p];
          } catch (e) {
            return undefined;
          }
        },
      });
    },
  };
}
