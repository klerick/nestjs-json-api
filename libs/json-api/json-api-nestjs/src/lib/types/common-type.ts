import { ModuleMetadata, PipeTransform, Type } from '@nestjs/common';

export type NestController = NonNullable<ModuleMetadata['controllers']>;
export type NestProvider = NonNullable<ModuleMetadata['providers']>;
export type NestImport = NonNullable<ModuleMetadata['imports']>;
export type PipeMixin = Type<PipeTransform>;
