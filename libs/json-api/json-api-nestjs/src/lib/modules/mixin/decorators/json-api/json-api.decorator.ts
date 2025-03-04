import { AnyEntity, EntityClass } from '@klerick/json-api-nestjs-shared';
import {
  JSON_API_DECORATOR_ENTITY,
  JSON_API_DECORATOR_OPTIONS,
} from '../../../../constants';
import { DecoratorOptions } from '../../types';

export function JsonApi(
  entity: EntityClass<AnyEntity>,
  options?: DecoratorOptions
): ClassDecorator {
  return (target): typeof target => {
    Reflect.defineMetadata(JSON_API_DECORATOR_ENTITY, entity, target);
    if (options) {
      Reflect.defineMetadata(JSON_API_DECORATOR_OPTIONS, options, target);
    }
    return target;
  };
}
