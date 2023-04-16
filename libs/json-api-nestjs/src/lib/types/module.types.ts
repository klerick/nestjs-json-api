import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { DynamicModule, PipeTransform } from '@nestjs/common';

export type Entity = EntityClassOrSchema;
export type NestController = Type<any>;
export type NestProvider = Type<any>;
export type NestImport = Type<any>;
export type PipeMixin = Type<PipeTransform>;
export type PipeFabric = (
  entity: Entity,
  connectionName?: string,
  config?: ConfigParam
) => PipeMixin;

export interface ConfigParam {
  requiredSelectField: boolean;
  debug: boolean;
  maxExecutionTime: number;
  pipeForId: PipeMixin;
  overrideName?: string;
}

export interface ModuleOptions {
  entities: Entity[];
  controllers?: NestController[];
  connectionName?: string;
  providers?: NestProvider[];
  options?: Partial<ConfigParam>;
  imports?: NestImport[];
}

export interface BaseModuleOptions {
  entity: Entity;
  connectionName: string;
  controller?: NestController;
  config: ConfigParam;
  imports?: NestImport[];
}

export interface BaseModuleStaticClass {
  new (): any;
  forRoot(options: BaseModuleOptions): DynamicModule;
}
