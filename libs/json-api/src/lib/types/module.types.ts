import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { NestInterceptor, PipeTransform } from '@nestjs/common';
import { Repository } from 'typeorm';

import { JsonApiController, JsonApiTransform, JsonApiService, SwaggerConfig } from '.';

export type PipeFabric = (entity: Entity, connectionName?: string) => PipeTransformMixin;
export type PipeTransformMixin = Type<PipeTransform>;
export type InterceptorMixin = Type<NestInterceptor>;
export type RepositoryMixin = Repository<Entity>;
export type ControllerMixin = Type<JsonApiController>;
export type ServiceMixin = Type<JsonApiService>;
export type TransformMixin = Type<JsonApiTransform>;
export type NestController = Type<any>;
export type NestProvider = Type<any>;
export type NestImport = Type<any>;
export type ProviderMixin = Type<any>;
export type Entity = EntityClassOrSchema;

export interface ModuleOptions {
  globalPrefix: string;
  controllers?: NestController[];
  imports?: NestImport[];
  entities: Entity[];
  swagger?: SwaggerConfig;
  providers?: NestProvider[];
  connectionName?: string;
}

export interface ModuleConfig {
  globalPrefix: string;
}
