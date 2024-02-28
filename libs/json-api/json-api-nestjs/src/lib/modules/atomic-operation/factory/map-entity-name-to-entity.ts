import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { ValueProvider } from '@nestjs/common';
import { MapEntity } from '../types';
import { MAP_ENTITY } from '../constants';
import { camelToKebab, getEntityName } from '../../../helper';

export function MapEntityNameToEntity(
  entities: EntityClassOrSchema[]
): ValueProvider<MapEntity> {
  return {
    provide: MAP_ENTITY,
    useValue: entities.reduce(
      (acum, item) => acum.set(camelToKebab(getEntityName(item)), item),
      new Map<string, EntityClassOrSchema>()
    ),
  };
}
