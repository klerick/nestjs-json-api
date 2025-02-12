import {
  AnyEntity,
  EntityName,
  NestController,
  NestImport,
  NestProvider,
  PipeMixin,
} from './util-types';
import { NonEmptyArray } from 'zod-validation-error';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

export type ExtractNestType<ArrayType> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type ConfigParam = {
  requiredSelectField: boolean;
  debug: boolean;
  pipeForId: PipeMixin;
  operationUrl: string;
  overrideRoute: string;
};

export type GeneralParam = {
  connectionName?: string;
  entities: NonEmptyArray<EntityName<AnyEntity>>;
  controllers?: NestController;
  providers?: NestProvider;
  imports?: NestImport;
};

export type ResultGeneralParam = {
  connectionName: string;
  entities: NonEmptyArray<EntityName<AnyEntity>>;
  controllers: NestController;
  providers: NestProvider;
  imports: NestImport;
};

export interface BaseModuleOptions {
  entity: EntityClassOrSchema;
  connectionName: string;
  controller?: ExtractNestType<NestController>;
  config: ConfigParam;
  imports?: NestImport;
}
