import { Options } from '@mikro-orm/core';

import ormConfig from './config-cli';

const { entitiesTs, ...configOther } = ormConfig;

export const config: Options = {
  discovery: { requireEntitiesArray: true },
  ...configOther,
};
