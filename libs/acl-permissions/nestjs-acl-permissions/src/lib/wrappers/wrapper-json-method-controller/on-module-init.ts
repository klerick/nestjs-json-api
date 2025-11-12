import { OrmService } from '@klerick/json-api-nestjs';
import { MODULE_REF_PROPS, ORIGINAL_ORM_SERVICE, ACL_CONTROLLER_METADATA } from '../../constants';
import { getProxyOrm } from './get-proxy-orm';
import type { AclControllerMetadata } from '../../types';

import {type WrapperJsonApiController} from '../'

export function onModuleInit<E extends object, IdKey extends string>(
  this: WrapperJsonApiController<E>
) {
  const serviceSymbolsProps = Object.getOwnPropertySymbols(this).find(
    (sym) => sym.description === 'ORM_SERVICE_PROPS'
  );

  if (!serviceSymbolsProps) throw new Error('Not found ORM_SERVICE_PROPS');
  const ormService: OrmService<E, IdKey> = Reflect.get(
    this,
    serviceSymbolsProps
  );

  // Get ACL metadata to check which methods are disabled
  const metadata: AclControllerMetadata | undefined = Reflect.getMetadata(
    ACL_CONTROLLER_METADATA,
    this.constructor
  );

  Reflect.set(
    this,
    serviceSymbolsProps,
    getProxyOrm(ormService, this[MODULE_REF_PROPS], metadata)
  );
  Reflect.set(this, ORIGINAL_ORM_SERVICE, ormService);
}
