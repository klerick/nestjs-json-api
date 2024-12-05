import { ModuleMetadata, Type, PipeTransform } from '@nestjs/common';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

export type NestController = ModuleMetadata['controllers'];
export type NestProvider = ModuleMetadata['providers'];
export type NestImport = ModuleMetadata['imports'];
export type PipeMixin = Type<PipeTransform>;
export type Entity = EntityClassOrSchema | ObjectLiteral;

export type PipeFabric = (
  entity: Entity,
  connectionName: string,
  config?: ConfigParam
) => PipeMixin;

export type ExtractNestType<ArrayType> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export interface ConfigParam {
  requiredSelectField: boolean;
  debug: boolean;
  useSoftDelete: boolean;
  pipeForId: PipeMixin;
  operationUrl?: string;
  overrideRoute?: string;
  runInTransaction?: <Func extends (...args: any) => any>(
    isolationLevel: IsolationLevel,
    fn: Func
  ) => ReturnType<Func>;
}

export interface ModuleOptions {
  entities: EntityClassOrSchema[];
  controllers?: NestController;
  connectionName?: string;
  providers?: NestProvider;
  options?: Partial<ConfigParam>;
  imports?: NestImport;
}

export interface BaseModuleOptions {
  entity: EntityClassOrSchema;
  connectionName: string;
  controller?: ExtractNestType<NestController>;
  config: ConfigParam;
  imports?: NestImport;
}
