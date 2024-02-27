import { DynamicModule, ValueProvider } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { MapController } from '../types';
import { MAP_CONTROLLER_ENTITY } from '../constants';

export function MapControllerEntity(
  entities: EntityClassOrSchema[],
  entityModules: DynamicModule[]
): ValueProvider<MapController> {
  const mapController = entities.reduce((acum, entity, index) => {
    const entityModule = entityModules[index];
    if (entityModule.controllers) {
      const controller = entityModule.controllers.at(0);
      if (controller) acum.set(entity, controller);
    }

    return acum;
  }, new Map<EntityClassOrSchema, Type<any>>());

  return {
    provide: MAP_CONTROLLER_ENTITY,
    useValue: mapController,
  };
}
