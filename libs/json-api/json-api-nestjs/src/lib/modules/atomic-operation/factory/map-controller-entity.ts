import { DynamicModule, ValueProvider, Type } from '@nestjs/common';
import { AnyEntity, EntityClass } from '@klerick/json-api-nestjs-shared';
import { MapController } from '../types';
import { MAP_CONTROLLER_ENTITY } from '../constants';
import { entityForClass } from '../../mixin/helpers';

export function MapControllerEntity(
  entityModules: DynamicModule[]
): ValueProvider<MapController> {

  const mapController = entityModules
    .reduce((acum, entityModule) => {
    const controller = entityModule.controllers?.at(0);
    if (controller) {
      const entity = entityForClass(controller);
      acum.set(entity, controller);
    }
    return acum;
  }, new Map<EntityClass<AnyEntity>, Type<any>>());

  return {
    provide: MAP_CONTROLLER_ENTITY,
    useValue: mapController,
  };
}
