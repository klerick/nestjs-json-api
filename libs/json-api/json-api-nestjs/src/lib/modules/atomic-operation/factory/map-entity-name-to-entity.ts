import { ValueProvider } from '@nestjs/common';
import { kebabCase } from 'change-case-commonjs';
import { MapEntity } from '../types';
import { MAP_ENTITY } from '../constants';
import { AnyEntity, EntityClass } from '../../../types';

import { getEntityName } from '@klerick/json-api-nestjs-shared';

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
