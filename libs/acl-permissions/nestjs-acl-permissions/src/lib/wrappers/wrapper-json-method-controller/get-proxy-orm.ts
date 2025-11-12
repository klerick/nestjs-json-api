import { OrmService } from '@klerick/json-api-nestjs';
import { ModuleRef } from '@nestjs/core';

import {
  getAllProxy,
  getOneProxy,
  deleteOneProxy,
  patchOneProxy,
  postOneProxy,
  getRelationshipProxy,
  deleteRelationshipProxy,
  patchRelationshipProxy,
  postRelationshipProxy
} from './method-proxy';
import type { AclControllerMetadata } from '../../types';

export function getProxyOrm<E extends object, IdKey extends string>(
  ormService: OrmService<E, IdKey>,
  moduleRef: ModuleRef,
  metadata?: AclControllerMetadata
) {
  return new Proxy(ormService, {
    get(target, prop: keyof OrmService<E, IdKey>) {
      // Fast path: if method is explicitly disabled, return original method
      // This avoids proxy overhead when ACL is turned off for specific methods
      if (metadata?.methods?.[prop as string] === false) {
        return target[prop].bind(target);
      }

      switch (prop) {
        case 'getAll':
          return getAllProxy<E, IdKey>(moduleRef).bind(target);
        case 'getOne':
          return getOneProxy<E, IdKey>(moduleRef).bind(target);
        case 'patchOne':
          return patchOneProxy<E, IdKey>(moduleRef).bind(target);
        case 'postOne':
          return postOneProxy<E, IdKey>(moduleRef).bind(target);
        case 'deleteOne':
          return deleteOneProxy<E, IdKey>(moduleRef).bind(target);
        case 'getRelationship':
          return getRelationshipProxy<E, IdKey>(moduleRef).bind(target);
        case 'postRelationship':
          return postRelationshipProxy<E, IdKey>(moduleRef).bind(target);
        case 'patchRelationship':
          return patchRelationshipProxy<E, IdKey>(moduleRef).bind(target);
        case 'deleteRelationship':
          return deleteRelationshipProxy<E, IdKey>(moduleRef).bind(target);
        default:
          return target[prop].bind(target);
      }
    },
    has(target, prop) {
      return Reflect.has(target, prop);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(target, prop) {
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
  });
}
