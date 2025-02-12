import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { config as ormConfig } from './config-cli';
import * as allEntities from './entities';

export const config: TypeOrmModuleOptions = {
  ...ormConfig,
  ...{
    entities: Object.values(allEntities) as any,
  },
};
