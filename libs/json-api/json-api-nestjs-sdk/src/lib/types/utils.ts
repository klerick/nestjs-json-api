import { TypeOfArray } from '@klerick/json-api-nestjs-shared';
export { TypeOfArray };

type IntersectionToObj<T> = {
  [K in keyof T]: T[K];
};
export type PartialByKeys<T, K extends keyof T> = IntersectionToObj<
  {
    [P in keyof T as P extends K ? P : never]?: T[P];
  } & {
    [P in Exclude<keyof T, K>]: T[P];
  }
>;

export type ReturnIfArray<I, O> = I extends unknown[] ? O[] : O;

export type FunctionProperty<T, K extends keyof T> = T[K] extends (
  ...args: any
) => any
  ? T[K]
  : never;

export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? K : never;
}[keyof T];

export type Parameters<T extends (...args: unknown[]) => unknown> = T extends (
  ...args: infer P
) => unknown
  ? P
  : never;
