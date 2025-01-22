import { EntityField, EntityProps } from '@klerick/json-api-nestjs-shared';

export { EntityField, EntityProps };

export type EntityRelation<T> = {
  [P in keyof T]: T[P] extends EntityField ? never : P;
}[keyof T];

export type EntityType<T> = {
  new (): T;
};

export type Entity = {
  [key: string]: any;
};
