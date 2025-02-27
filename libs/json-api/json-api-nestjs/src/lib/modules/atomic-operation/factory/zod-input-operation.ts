import { FactoryProvider } from '@nestjs/common';
import { MAP_CONTROLLER_ENTITY, ZOD_INPUT_OPERATION } from '../constants';
import { MapController } from '../types';
import { zodInputOperation, ZodInputOperation } from '../utils';
import { ENTITY_PARAM_MAP } from '../../../constants';
import { EntityParamMap } from '../../mixin/types';
import { AnyEntity, EntityClass, ObjectLiteral } from '../../../types';

export function ZodInputOperation<E extends ObjectLiteral>(): FactoryProvider<
  ZodInputOperation<E>
> {
  return {
    provide: ZOD_INPUT_OPERATION,
    useFactory(
      mapController: MapController<E>,
      entityMapProps: EntityParamMap<EntityClass<AnyEntity>>
    ) {
      return zodInputOperation(mapController, entityMapProps);
    },
    inject: [MAP_CONTROLLER_ENTITY, ENTITY_PARAM_MAP],
  };
}
