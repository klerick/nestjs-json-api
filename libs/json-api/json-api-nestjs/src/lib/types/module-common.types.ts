import {
  MicroOrmJsonApiModule,
  TypeOrmJsonApiModule,
  TypeOrmParam,
  MicroOrmParam,
} from '../modules';

import { ConfigParam, GeneralParam, ResultGeneralParam } from './config-param';
import { RequiredFromPartial } from './util-types';

export type TypeOrmConfigParam = ConfigParam & TypeOrmParam;

export type TypeOrmDefaultOptions = GeneralParam & {
  options: Partial<TypeOrmConfigParam>;
};
export type TypeOrmOptions = GeneralParam & {
  options: Partial<TypeOrmConfigParam>;
};

export type MicroOrmConfigParam = ConfigParam & MicroOrmParam;
export type MicroOrmOptions = GeneralParam & {
  options: Partial<MicroOrmConfigParam>;
};

export type ResultTypeOrmModuleOptions = ResultGeneralParam & {
  type: typeof TypeOrmJsonApiModule;
} & TypeOrmOptions & { options: RequiredFromPartial<TypeOrmConfigParam> };
export type ResultMicroOrmModuleOptions = ResultGeneralParam & {
  type: typeof MicroOrmJsonApiModule;
} & MicroOrmOptions & { options: RequiredFromPartial<MicroOrmConfigParam> };

export type ResultModuleOptions =
  | ResultTypeOrmModuleOptions
  | ResultMicroOrmModuleOptions;
