import { DataSource } from 'typeorm';
import { FactoryProvider } from '@nestjs/common';
import { MAP_CONTROLLER_ENTITY, ZOD_INPUT_OPERATION } from '../constants';
import { MapController } from '../types';
import { CURRENT_DATA_SOURCE_TOKEN } from '../../../constants';
import {
  zodInputOperation,
  ZodInputOperation as TypeZodInputOperation,
} from '../utils/zod/zod-helper';

export function ZodInputOperation(
  connectionName?: string
): FactoryProvider<TypeZodInputOperation> {
  return {
    provide: ZOD_INPUT_OPERATION,
    useFactory(dataSource: DataSource, mapController: MapController) {
      return zodInputOperation(dataSource, mapController);
    },
    inject: [
      {
        token: CURRENT_DATA_SOURCE_TOKEN,
        optional: false,
      },
      {
        token: MAP_CONTROLLER_ENTITY,
        optional: false,
      },
    ],
  };
}
