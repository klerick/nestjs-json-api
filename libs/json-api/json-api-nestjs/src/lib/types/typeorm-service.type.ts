import { Repository } from 'typeorm';

import { ConfigParam, Entity } from './';
import type { MethodsService } from '../helper';
import { TypeormUtilsService } from '../service';
import { TransformDataService } from '../mixin/service';

export type TypeormServiceObject<E extends Entity> = {
  repository: Repository<E>;
  config: ConfigParam;
  typeormUtilsService: TypeormUtilsService<E>;
  transformDataService: TransformDataService<E>;
};

export type TypeormService<E extends Entity> = MethodsService<E>;
