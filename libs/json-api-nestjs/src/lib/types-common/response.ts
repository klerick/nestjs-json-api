import { ElementType, EntityProps, EntityRelation } from './common';

type ValueOf<T> = T[keyof T];
type Includes<T> = {
  [P in EntityRelation<T>]: ResourceData<ElementType<T[P]>>;
}

export type PageProps = {
  totalItems: number,
  pageNumber: number,
  pageSize: number
}

export type Meta = PageProps & {
  debug?: {
    prepareParams: number,
    callQuery: number,
    transform: number
  }
}

export type Links = {
  self: string,
  related?: string
}

export type Attributes<D> = {
  [P in EntityProps<D>]: ElementType<D[P]>
}
export type RelationshipData<T> = Pick<ResourceData<T>, 'type' | 'id'>

export type Relationship<T> = {
  data?: T extends (infer U)[] ? RelationshipData<T>[] : RelationshipData<T>,
  links?: Links;
}


export type Relationships<T> = {
  [P in EntityRelation<T>]: Relationship<T[P]>;
}

export type ResourceData<T> = {
  type: string;
  id: string;
  attributes?: Attributes<Omit<T, 'id'>>;
  relationships?: Partial<Relationships<T>>;
  links?: Links;
}


export type ResourceObject<T>  = {
  meta?: Partial<Meta>;
  data: ResourceData<T> | ResourceData<T>[],
  included?: ValueOf<Includes<T>>[]
}

