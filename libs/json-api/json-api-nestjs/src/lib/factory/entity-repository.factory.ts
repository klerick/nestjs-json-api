import { FactoryProvider } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Entity } from '../types';
import {
  CURRENT_DATA_SOURCE_TOKEN,
  CURRENT_ENTITY_REPOSITORY,
} from '../constants';
import { EntityTarget } from 'typeorm/common/EntityTarget';

export function EntityRepositoryFactory<E extends Entity>(
  entity: E
): FactoryProvider<Repository<E>> {
  return {
    provide: CURRENT_ENTITY_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository<E>(entity as EntityTarget<E>),
    inject: [
      {
        token: CURRENT_DATA_SOURCE_TOKEN,
        optional: false,
      },
    ],
  };
}
