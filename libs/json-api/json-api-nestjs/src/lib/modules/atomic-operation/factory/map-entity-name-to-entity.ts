import { ValueProvider } from '@nestjs/common';
import {
  getEntityName,
  AnyEntity,
  EntityClass,
} from '@klerick/json-api-nestjs-shared';
import { kebabCase } from 'change-case-commonjs';
import { MapEntity } from '../types';
import { MAP_ENTITY } from '../constants';

export function MapEntityNameToEntity(
  entities: EntityClass<AnyEntity>[]
): ValueProvider<MapEntity> {
  return {
    provide: MAP_ENTITY,
    useValue: entities.reduce(
      (acum, item) => acum.set(kebabCase(getEntityName(item)), item),
      new Map<string, EntityClass<AnyEntity>>()
    ),
  };
}
