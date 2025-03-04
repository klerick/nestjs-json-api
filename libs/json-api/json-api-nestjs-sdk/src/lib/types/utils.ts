export type ReturnIfArray<I, O> = I extends unknown[] ? O[] : O;

export type PartialByKeys<E, K extends keyof E> = Omit<E, K> &
  Partial<Pick<E, K>>;

export type FunctionProperty<T, K extends keyof T> = T[K] extends (
  ...args: any
) => any
  ? T[K]
  : never;

export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? K : never;
}[keyof T];
