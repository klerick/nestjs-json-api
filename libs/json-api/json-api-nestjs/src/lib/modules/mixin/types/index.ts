export * from './binding.type';
export * from './decorator-options.type';
export * from './orm-service.type';
export * from './module.type';
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [x: string]: JSONValue }
  | Array<JSONValue>;
