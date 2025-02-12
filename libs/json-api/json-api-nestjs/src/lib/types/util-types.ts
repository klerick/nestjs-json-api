import { ModuleMetadata, PipeTransform, Type } from '@nestjs/common';
import { EntityTarget as EntityTargetTypeOrm } from 'typeorm/common/EntityTarget';

export type AnyEntity<T = ObjectLiteral> = Partial<T>;

export type EntityClass<T> = Function & { prototype: T };
export type EntityName<T> = EntityClass<T>;
export type EntityTarget<T> = EntityClass<T> | EntityTargetTypeOrm<T>;
export interface ObjectLiteral {
  [key: string]: any;
}

export type NestController = NonNullable<ModuleMetadata['controllers']>;
export type NestProvider = NonNullable<ModuleMetadata['providers']>;
export type NestImport = NonNullable<ModuleMetadata['imports']>;
export type PipeMixin = Type<PipeTransform>;

export type RequiredFromPartial<T> = {
  [P in keyof T]-?: T[P] extends infer U | undefined ? U | false : T[P];
};

export type RunInTransaction<
  F extends (...arg: any[]) => Promise<any> = (...arg: any[]) => Promise<any>
> = (arg: F) => ReturnType<F>;
