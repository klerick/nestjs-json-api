import { MethodName } from './binding.types';

import { RequiredFromPartial, ConfigParam } from '../../../types';
import { MicroOrmParam } from '../../micro-orm';
import { TypeOrmParam } from '../../type-orm';

export type DecoratorOptions = Partial<
  {
    allowMethod: Array<MethodName>;
  } & RequiredFromPartial<ConfigParam & (MicroOrmParam | TypeOrmParam)>
>;
