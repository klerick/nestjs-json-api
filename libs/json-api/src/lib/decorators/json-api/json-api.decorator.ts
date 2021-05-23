import { JSON_API_ENTITY } from '../../constants/reflection';
import { Entity } from '../../types/module.types';


export function JsonApi(entity: Entity): ClassDecorator {
  return (target): typeof target => {
    Reflect.defineMetadata(JSON_API_ENTITY, entity, target);
    return target;
  };
}
