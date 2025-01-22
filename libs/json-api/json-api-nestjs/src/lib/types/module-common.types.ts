import {
  MicroOrmModule,
  TypeOrmModule,
  TypeOrmParam,
  MicroOrmParam,
} from '../modules';

import { ConfigParam, GeneralParam, ResultGeneralParam } from './config-param';
import { RequiredFromPartial } from './util-types';

export type ModuleOptions =
  | (GeneralParam & {
      type: typeof MicroOrmModule;
      options: Partial<ConfigParam & MicroOrmParam>;
    })
  | (GeneralParam & {
      type?: typeof TypeOrmModule;
      options: Partial<ConfigParam & TypeOrmParam>;
    });

export type ResultModuleOptions =
  | (ResultGeneralParam & {
      type: typeof MicroOrmModule;
      options: RequiredFromPartial<ConfigParam & MicroOrmParam>;
    })
  | (ResultGeneralParam & {
      type: typeof TypeOrmModule;
      options: RequiredFromPartial<ConfigParam & TypeOrmParam>;
    });
