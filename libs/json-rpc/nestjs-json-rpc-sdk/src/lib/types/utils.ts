import { Transport } from './rpc';

export type LoopFunc = (...args: any) => any;

export type ReturnGenericType<T extends LoopFunc> =
  ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;

export type HttpAgentFactory<T extends LoopFunc> = (
  url: string
) => Transport<T>;
