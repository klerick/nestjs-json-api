import { FactoryProvider } from '@nestjs/common';
import { MAP_CONTROLLER_ENTITY, ZOD_INPUT_OPERATION } from '../constants';
import { MapController } from '../types';
import { zodInputOperation, ZodInputOperation } from '../utils';
import { ENTITY_MAP_PROPS } from '../../../constants';
import { ZodEntityProps } from '../../mixin/types';
import { EntityClass, ObjectLiteral } from '../../../types';

export function ZodInputOperation<E extends ObjectLiteral>(): FactoryProvider<
  ZodInputOperation<E>
> {
  return {
    provide: ZOD_INPUT_OPERATION,
    useFactory(
      mapController: MapController<E>,
      entityMapProps: Map<EntityClass<E>, ZodEntityProps<E>>
    ) {
      return zodInputOperation(mapController, entityMapProps);
    },
    inject: [MAP_CONTROLLER_ENTITY, ENTITY_MAP_PROPS],
  };
}
