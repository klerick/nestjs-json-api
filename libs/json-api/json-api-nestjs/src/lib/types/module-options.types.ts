import { DynamicModule, Type } from '@nestjs/common';
import { NonEmptyArray } from 'zod-validation-error';
import { AnyEntity, EntityClass } from '@klerick/json-api-nestjs-shared';
import {
  NestController,
  NestImport,
  NestProvider,
  PipeMixin,
} from './common-type';
import { ExtractNestType, IfEquals } from './utils-type';

type ModuleCommonParams = {
  entities: NonEmptyArray<EntityClass<AnyEntity>>;
  excludeControllers?: EntityClass<AnyEntity>[];
  connectionName?: string;
  controllers?: NestController;
  providers?: NestProvider;
  imports?: NestImport;
  hooks?: {
    afterCreateController: (controller: Type<any>) => void;
  }
};

type ModuleCommonOptions = {
  requiredSelectField?: boolean;
  debug?: boolean;
  pipeForId?: PipeMixin;
  operationUrl?: string;
  allowSetId?: boolean
};

type ModuleOptionsParams<OrmParams = NonNullable<unknown>> = IfEquals<
  OrmParams,
  NonNullable<unknown>,
  {
    options?: OptionOfConfig<OrmParams>;
  },
  {
    options: OptionOfConfig<OrmParams>;
  }
>;

type ExtractOrmParamsOfModule<M> = M extends {
  forRoot(options: PrepareParams<infer U>): DynamicModule;
}
  ? U
  : never;

export type ParamsModule<M> = Params<ExtractOrmParamsOfModule<M>>;

export type Params<OrmParams = NonNullable<unknown>> = ModuleCommonParams &
  ModuleOptionsParams<OrmParams>;

export type PrepareParams<OrmParams = NonNullable<unknown>> =
  Required<ModuleCommonParams> & {
    options: Required<Omit<ModuleCommonOptions, 'operationUrl'>> & {
      operationUrl: string | undefined;
    } & OrmParams;
  };

export type OptionOfConfig<OrmParams> = ModuleCommonOptions & OrmParams;

export interface OrmModule<OrmParams = NonNullable<unknown>> {
  new (...args: any[]): any;
  forRoot(options: Params<OrmParams>): DynamicModule;
  getUtilProviders(entity: EntityClass<AnyEntity>): NestProvider;
}

export type ModuleMixinOptions = {
  entity: EntityClass<AnyEntity>;
  controller: ExtractNestType<NestController> | undefined;
  config: PrepareParams;
  imports: NestImport;
  ormModule: OrmModule;
};
