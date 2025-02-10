import {
  EntityField,
  EntityProps,
  EntityRelation,
  TypeOfArray,
  ValueOf,
} from '.';
import { Collection } from '@mikro-orm/core';

export type PageProps = {
  totalItems: number;
  pageNumber: number;
  pageSize: number;
};

export type DebugMetaProps = Partial<{
  time: number;
}>;

export type MainData<T = string> = {
  type: T;
  id: string;
};

export type Links = {
  self: string;
  related?: string;
};

export type Attributes<D> = {
  [P in EntityProps<D>]?: D[P] extends EntityField ? D[P] : TypeOfArray<D[P]>;
};

export type DataResult<E, S = string> = E extends unknown[]
  ? MainData<S>[]
  : E extends Collection<any>
  ? MainData<S>[]
  : MainData<S> | null;

export type Data<E, S = string> = {
  data?: DataResult<E, S>;
};

export type Relationships<T> = {
  [P in EntityRelation<T>]?: {
    links: Links;
  } & Data<T[P], P>;
};

export type Include<T> = ValueOf<{
  [P in EntityRelation<T>]: ResourceData<TypeOfArray<T[P]>>;
}>;

export type ResourceData<T> = MainData & {
  attributes?: Attributes<T>;
  relationships?: Relationships<T>;
  links: Omit<Links, 'related'>;
};

export type MetaProps<T, R = null> = R extends null ? T : T & R;

export type ResourceObject<
  T,
  R extends 'object' | 'array' = 'object',
  M = null
> = {
  meta: R extends 'array'
    ? MetaProps<PageProps & DebugMetaProps, M>
    : MetaProps<DebugMetaProps, M>;
  data: R extends 'array' ? ResourceData<T>[] : ResourceData<T>;
  included?: Include<T>[];
};

export type ResourceObjectRelationships<E, K extends EntityRelation<E>> = {
  meta: DebugMetaProps;
} & Required<Data<E[K], K>>;
