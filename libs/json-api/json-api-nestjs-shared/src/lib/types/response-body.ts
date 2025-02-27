import {
  PropertyKeys,
  RelationKeys,
  IsIterator,
  CastIteratorType,
} from './entity-type';
import { ValueOf } from './entity-type';

export type DebugMetaProps = Partial<{
  time: number;
}>;

export type PageProps = {
  totalItems: number;
  pageNumber: number;
  pageSize: number;
};

export type MainData<T = string> = {
  type: T;
  id: string;
};

export type BaseMainData<
  Entity,
  IdKey extends string,
  Rel extends RelationKeys<Entity, IdKey>
> = {
  data: IsIterator<Entity[Rel]> extends 1
    ? MainData[]
    : [Extract<Entity[Rel], null>] extends [never]
    ? MainData
    : MainData | null;
};

export type MetaProps<T, R = null> = R extends null ? T : T & R;

export type MetaPropsForArrayResourceObject = MetaProps<
  PageProps,
  DebugMetaProps
>;
export type Links = {
  self: string;
};

export type BaseLinks = {
  links: Links;
};

export type Attributes<Entity extends object, IdKey extends string = 'id'> = {
  [P in Exclude<PropertyKeys<Entity>, IdKey>]?: Entity[P];
};

export type BaseAttribute<
  Entity extends object,
  IdKey extends string = 'id'
> = {
  attributes?: Attributes<Entity, IdKey>;
};

export type Relationships<
  Entity extends object,
  IdKey extends string = 'id'
> = {
  [P in RelationKeys<Entity, IdKey>]?:
    | BaseLinks
    | (BaseLinks & BaseMainData<Entity, IdKey, P>);
};

export type BaseRelationships<
  Entity extends object,
  IdKey extends string = 'id'
> = { relationships?: Relationships<Entity, IdKey> };

export type Meta<
  Type extends 'object' | 'array',
  ExtendBase
> = Type extends 'array'
  ? MetaProps<MetaPropsForArrayResourceObject, ExtendBase>
  : MetaProps<DebugMetaProps, ExtendBase>;

export type BaseMeta<
  Type extends 'object' | 'array' = 'object',
  ExtendBase = null
> = {
  meta: Meta<Type, ExtendBase>;
};

export type BaseResourceData<
  Entity extends object,
  Type extends 'object' | 'array' = 'object',
  IdKey extends string = 'id'
> = {
  data: Type extends 'array'
    ? ResourceData<Entity, IdKey>[]
    : ResourceData<Entity, IdKey>;
};

export type Include<Entity, IdKey extends string = 'id'> = ValueOf<{
  [Rel in RelationKeys<Entity, IdKey>]: CastIteratorType<
    Entity[Rel]
  > extends object
    ? ResourceData<CastIteratorType<Entity[Rel]>>
    : never;
}>;

export type BaseIncluded<Entity extends object, IdKey extends string = 'id'> = {
  included?: Include<Entity, IdKey>[];
};

export type ResourceData<
  Entity extends object,
  IdKey extends string = 'id'
> = MainData &
  BaseAttribute<Entity, IdKey> &
  BaseRelationships<Entity, IdKey> &
  BaseLinks;

export type ResourceObject<
  Entity extends object,
  Type extends 'object' | 'array' = 'object',
  ExtendBase = null,
  IdKey extends string = 'id'
> = BaseMeta<Type, ExtendBase> &
  BaseResourceData<Entity, Type, IdKey> &
  BaseIncluded<Entity, IdKey>;

export type ResourceObjectRelationships<
  Entity extends object,
  IdKey extends string,
  Rel extends RelationKeys<Entity, IdKey>
> = BaseMeta & BaseMainData<Entity, IdKey, Rel>;
