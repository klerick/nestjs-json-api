import type { AnyEntity } from '@klerick/json-api-nestjs-shared';
import type { JsonBaseController } from '@klerick/json-api-nestjs';
import { UseGuards } from '@nestjs/common';
import { ACL_CONTROLLER_METADATA } from '../constants';
import type { AclControllerOptions, AclControllerMetadata, AclControllerMethodsOptions } from '../types';

import { AclGuard } from '../guards';

export function AclController<
  E extends AnyEntity = AnyEntity,
  Controller = JsonBaseController<E, 'id'>
>(options: AclControllerOptions<E, Controller>) {
  return function <T extends abstract new (...args: any[]) => any>(
    target: T
  ): T {
    const metadata: AclControllerMetadata<E> = {
      subject: options.subject,
      methods: (options.methods || {}) as Record<string, AclControllerMethodsOptions>,
      enabled: options.enabled ?? true,
    };

    Reflect.defineMetadata(ACL_CONTROLLER_METADATA, metadata, target);
    UseGuards(AclGuard)(target);
    return target;
  };
}
