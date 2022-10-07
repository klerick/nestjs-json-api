import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TypeormMixinService } from './typeorm.mixin';
import { Entity as EntityClassOrSchema, NestProvider } from '../../../types';
import { getProviderName, nameIt } from '../../../helper';
import {
  CONFIG_PARAM_POSTFIX,
  TYPEORM_MIXIN_SERVICE_POSTFIX,
} from '../../../constants';

export function typeormMixin<Entity extends EntityClassOrSchema>(
  entity: Entity,
  connectionName: string,
  transformService: NestProvider
): NestProvider {
  const serviceClass = nameIt(
    getProviderName(entity, TYPEORM_MIXIN_SERVICE_POSTFIX),
    TypeormMixinService
  );
  Injectable()(serviceClass);
  InjectRepository(entity, connectionName)(serviceClass, 'repository', 0);
  Inject(getProviderName(entity, CONFIG_PARAM_POSTFIX))(
    serviceClass,
    'config',
    1
  );
  Inject(transformService)(serviceClass, 'transform', 2);
  return serviceClass;
}
