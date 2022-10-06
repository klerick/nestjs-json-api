import {Inject, Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {ApplicationConfig} from '@nestjs/core';

import {Entity as EntityClassOrSchema, NestProvider} from '../../../types';
import {getProviderName, nameIt} from '../../../helper';
import {TransformMixinService} from './transform.mixin';
import {CONFIG_PARAM_POSTFIX, TRANSFORM_MIXIN_SERVICE_POSTFIX} from '../../../constants';



export function transformMixin<Entity extends EntityClassOrSchema>(entity: Entity, connectionName: string): NestProvider {
  const serviceClass = nameIt(getProviderName(entity, TRANSFORM_MIXIN_SERVICE_POSTFIX), TransformMixinService);
  Injectable()(serviceClass);
  InjectRepository(entity, connectionName)(serviceClass, 'repository', 0);
  Inject(getProviderName(entity, CONFIG_PARAM_POSTFIX))(serviceClass, 'config', 1);
  Inject(ApplicationConfig)(serviceClass, 'applicationConfig', 2);
  return serviceClass;
}
