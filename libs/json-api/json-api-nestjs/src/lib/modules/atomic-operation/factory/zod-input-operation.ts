import { FactoryProvider } from '@nestjs/common';
import { MAP_CONTROLLER_ENTITY, ZOD_INPUT_OPERATION } from '../constants';
import { MapController } from '../types';
import { zodInputOperation, ZodInputOperation } from '../utils';
import { FIELD_FOR_ENTITY } from '../../../constants';
import { GetFieldForEntity } from '../../mixin/types';
import { ObjectLiteral } from '../../../types';

export function ZodInputOperation<E extends ObjectLiteral>(): FactoryProvider<
  ZodInputOperation<E>
> {
  return {
    provide: ZOD_INPUT_OPERATION,
    useFactory(
      mapController: MapController<E>,
      getField: GetFieldForEntity<E>
    ) {
      return zodInputOperation(mapController, getField);
    },
    inject: [MAP_CONTROLLER_ENTITY, FIELD_FOR_ENTITY],
  };
}
