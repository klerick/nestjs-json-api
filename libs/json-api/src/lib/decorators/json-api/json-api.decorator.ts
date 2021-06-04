import { JSON_API_ENTITY, JSON_API_OPTIONS } from '../../constants/reflection';
import { Entity } from '../../types/module.types';
import {DecoratorOptions} from '../../types/decorator-options.types';


export function JsonApi(entity: Entity, options?: DecoratorOptions): ClassDecorator {
  return (target): typeof target => {
    Reflect.defineMetadata(JSON_API_ENTITY, entity, target);
    if (options) {
      Reflect.defineMetadata(JSON_API_OPTIONS, options, target)
    }
    return target;
  };
}
