import { Constructor } from './utils-type';

// export interface ObjectLiteral {
//   [key: string]: unknown;
// }
export type ObjectLiteral<T = any> = {
  [P in keyof T]: T[P];
};

export type AnyEntity<T = object> = T;
export type EntityClass<T extends AnyEntity> = Constructor<T>;
