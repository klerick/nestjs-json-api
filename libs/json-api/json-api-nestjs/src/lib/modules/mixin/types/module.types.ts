import {
  AnyEntity,
  EntityName,
  NestImport,
  NestController,
  RequiredFromPartial,
  ConfigParam,
  PipeMixin,
  ExtractNestType,
  ResultModuleOptions,
} from '../../../types';
import { MicroOrmParam } from '../../micro-orm';
import { TypeOrmParam } from '../../type-orm';

type Controller = ExtractNestType<NestController>;

export interface MixinOptions {
  entity: EntityName<AnyEntity>;
  controller: Controller | undefined;
  config: RequiredFromPartial<ConfigParam & (MicroOrmParam | TypeOrmParam)>;
  imports: NestImport;
  ormModule: ResultModuleOptions['type'];
}

export type PipeFabric = <Entity extends EntityName<AnyEntity>>(
  entity: Entity,
  config?: MixinOptions['config']
) => PipeMixin;
