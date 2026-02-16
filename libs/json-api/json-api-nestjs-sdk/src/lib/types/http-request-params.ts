import {
  MainData,
  BaseAttribute,
  RelationKeys,
  BaseMainData,
} from '@klerick/json-api-nestjs-shared';

export type Relationships<
  Entity extends object,
  IdKey extends string = 'id'
> = {
  [P in RelationKeys<Entity, IdKey>]?: BaseMainData<Entity, IdKey, P>;
};

export type BaseRelationships<
  Entity extends object,
  IdKey extends string = 'id'
> = { relationships?: Relationships<Entity, IdKey> };

type PostMainData<T = string> = Omit<MainData<T>, 'id'> & {
  id?: string;
};

export type PostData<T extends object, IdKey extends string = 'id'> = {
  data: PostMainData & BaseAttribute<T, IdKey> & BaseRelationships<T, IdKey>;
  meta?: Record<string, unknown>;
};

export type PatchData<T extends object, IdKey extends string = 'id'> = {
  data: MainData & BaseAttribute<T, IdKey> & BaseRelationships<T, IdKey>;
  meta?: Record<string, unknown>;
};

export type RelationBodyData = {
  data: MainData | MainData[];
  meta?: Record<string, unknown>;
};
