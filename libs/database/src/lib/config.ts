import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { config as ormConfig } from './config-cli';
import { Roles, Comments, Users, Addresses } from './entities';

export const config: TypeOrmModuleOptions = {
  ...ormConfig,
  ...{
    entities: [Roles, Comments, Users, Addresses],
  },
};
