import { EntityClass } from '@klerick/json-api-nestjs-shared';
import { EntityParam } from '../../../types';

export type EntityParamMap<E extends object> = Map<E, EntityParam<E>>;

export type CheckRelationName<E extends object> = (
  entity: EntityClass<E>,
  params: string
) => boolean;

export type FindOneRowEntity<E extends object> = (
  entity: EntityClass<E>,
  params: number | string
) => Promise<E | null>;

export type RunInTransaction<
  F extends (...arg: any[]) => Promise<any> = (...arg: any[]) => Promise<any>
> = (arg: F) => ReturnType<F>;
