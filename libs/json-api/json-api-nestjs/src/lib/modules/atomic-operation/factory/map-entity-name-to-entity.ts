import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { ValueProvider } from '@nestjs/common';
import { camelToKebab } from '../../../utils/nestjs-shared';
import { MapEntity } from '../types';
import { MAP_ENTITY } from '../constants';
import { getEntityName } from '../../mixin/helper';
import { AnyEntity, EntityTarget } from '../../../types';

export function MapEntityNameToEntity(
  entities: EntityClassOrSchema[]
): ValueProvider<MapEntity> {
  return {
    provide: MAP_ENTITY,
    useValue: entities.reduce(
      (acum, item) => acum.set(camelToKebab(getEntityName(item)), item),
      new Map<string, EntityTarget<AnyEntity>>()
    ),
  };
}
