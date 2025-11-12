import { pascalCase } from 'change-case-commonjs';
import { Injectable, PipeTransform, Type } from '@nestjs/common';
import { AnyEntity, EntityClass } from '@klerick/json-api-nestjs-shared';
import { AclControllerMethodsOptions, AclModuleOptions } from '../types';


export * from './orm-proxy';

export function factoryPipeMixin(
  entity: EntityClass<AnyEntity>,
  pipe: Type<PipeTransform>
) {
  const entityName = entity.name;

  const pipeClass = nameIt(
    `${pascalCase(entityName)}${pipe.name}`,
    pipe
  ) as Type<PipeTransform>;

  Injectable()(pipeClass);

  return pipeClass;
}

export const nameIt = (
  name: string,
  cls: new (...rest: unknown[]) => Record<never, unknown>
) =>
  ({
    [name]: class extends cls {
      constructor(...arg: unknown[]) {
        super(...arg);
      }
    },
  }[name]);

export function copyMethodMetadata(source: Function, target: Function) {
  const metadataKeys = Reflect.getMetadataKeys(source);

  for (const key of metadataKeys) {
    const value = Reflect.getMetadata(key, source);
    Reflect.defineMetadata(key, value, target);
  }

  Object.defineProperty(target, 'name', {
    value: source.name,
    writable: false,
  });
}

export function getActionOptions(
  moduleOptions: AclModuleOptions,
  actionOptions: AclControllerMethodsOptions
): Exclude<AclControllerMethodsOptions, boolean> {
  const defaultOptions = {
    onNoRules: moduleOptions.onNoRules,
    defaultRules: moduleOptions.defaultRules,
  };

  if (
    actionOptions === undefined ||
    actionOptions === true ||
    actionOptions === false
  )
    return defaultOptions;

  return {
    ...defaultOptions,
    ...{
      onNoRules: actionOptions.onNoRules,
      defaultRules: actionOptions.defaultRules,
    },
  };
}
