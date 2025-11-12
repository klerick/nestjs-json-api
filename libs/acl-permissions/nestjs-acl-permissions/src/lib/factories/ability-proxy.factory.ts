import { ModuleRef } from '@nestjs/core';
import type { AclContextStore, AclModuleOptions } from '../types';
import { ExtendAbility } from './ability.factory';
import { ACL_CONTEXT_KEY, ACL_MODULE_OPTIONS } from '../constants';
import { FactoryProvider } from '@nestjs/common';


/**
 * Creates a Proxy for ExtendableAbility that lazily retrieves the actual ability
 * from CLS (Continuation Local Storage) on each method/property access.
 *
 * This allows the provider to be a SINGLETON while still accessing request-specific
 * ability instances without using Scope.REQUEST.
 *
 * @param moduleRef - NestJS ModuleRef for lazy dependency resolution
 * @param options - ACL module options containing contextStore configuration
 * @returns Proxy that acts as ExtendableAbility
 */
export function createAbilityProxy(
  moduleRef: ModuleRef,
  options: AclModuleOptions
): ExtendAbility {
  let contextStore: AclContextStore | undefined;

  /**
   * Lazily initializes and retrieves the context store
   */
  const getContextStore = (): AclContextStore | undefined => {
    if (!contextStore && options.contextStore) {
      contextStore = moduleRef.get(options.contextStore, {
        strict: false,
      });
    }
    return contextStore;
  };

  /**
   * Retrieves ExtendableAbility from CLS for the current request
   * Throws descriptive error if ability is not found
   */
  const getAbility = (): ExtendAbility => {
    const store = getContextStore();
    if (!store) {
      throw new Error(
        '[ACL] contextStore is not configured. ' +
          'Make sure you configured AclPermissionsModule.forRoot() with contextStore option. ' +
          'Example: { contextStore: ClsService }'
      );
    }

    const ability = store.get<ExtendAbility>(ACL_CONTEXT_KEY);

    if (!ability) {
      throw new Error(
        '[ACL] ExtendAbility not found in context store. ' +
          'Possible causes:\n' +
          '  1. Service is called BEFORE AclGuard executed (ability not yet created)\n' +
          '  2. No rules loaded for this action (check your RulesLoader.loadRules())\n' +
          '  3. AclGuard was not applied to this controller (check @AclController or wrapperJsonApiController hook)\n' +
          '  4. contextStore middleware is not mounted (check ClsModule configuration)'
      );
    }

    return ability;
  };

  // Create Proxy that forwards all method/property access to the real ExtendableAbility
  return new Proxy({} as ExtendAbility, {
    get(target, prop: string | symbol) {
      if (!Reflect.has(ExtendAbility.prototype, prop)) {
        return undefined;
      }

      // Special handling for Symbol.toStringTag (used by Object.prototype.toString)
      if (prop === Symbol.toStringTag) {
        return 'ExtendableAbility';
      }

      // Special handling for typeof checks
      if (prop === 'constructor') {
        return ExtendAbility;
      }

      // Get the actual ability from CLS
      const ability = getAbility();
      // Get the property/method from the real ability
      const value = Reflect.get(ability, prop, ability);

      // If it's a function, bind it to the ability instance
      if (typeof value === 'function') {
        return value.bind(ability);
      }

      return value;
    },

    // Support for 'prop in ability' checks
    has(target, prop) {
      const ability = getAbility();
      return Reflect.has(ability, prop);
    },

    // Support for Object.keys(), Object.getOwnPropertyNames(), etc.
    ownKeys(target) {
      const ability = getAbility();
      return Reflect.ownKeys(ability);
    },

    // Support for Object.getOwnPropertyDescriptor()
    getOwnPropertyDescriptor(target, prop) {
      const ability = getAbility();
      return Reflect.getOwnPropertyDescriptor(ability, prop);
    },
  });
}

export const AbilityProvider: FactoryProvider<ExtendAbility> = {
  provide: ExtendAbility,
  useFactory: createAbilityProxy,
  inject: [ModuleRef, ACL_MODULE_OPTIONS],
};
