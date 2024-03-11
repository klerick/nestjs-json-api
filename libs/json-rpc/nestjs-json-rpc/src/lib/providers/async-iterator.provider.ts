import { Provider } from '@nestjs/common';
import { ASYNC_ITERATOR_FACTORY } from '../constants';
import { PayloadRpc } from '../types';
import { undefined } from 'zod';

type ParamsReturn<R> = R extends (...arg: any) => infer P
  ? P extends Promise<infer T>
    ? T extends [infer K, ...any]
      ? K
      : T
    : P
  : never;

export type IterateFactory<
  I extends unknown[],
  C extends (...arg: any[]) => any
> = {
  createIterator: (
    iterateObject: I,
    callback: C
  ) => {
    [Symbol.asyncIterator](): GeneralAsyncIterator<C, I>;
  };
};

class GeneralAsyncIterator<
  C extends (...arg: any[]) => any,
  K extends unknown[],
  T = K[number],
  TReturn = ParamsReturn<C>
> {
  private counter = 0;
  private maxLimit!: number;

  constructor(private iterateObject: K, private callback: C) {
    if (!Array.isArray(iterateObject)) {
      throw new Error('Expected iterateObject to be an array');
    }
    this.maxLimit = iterateObject.length;
  }

  async next(): Promise<IteratorYieldResult<TReturn> | { done: true }> {
    const items = !Array.isArray(this.iterateObject[this.counter])
      ? [this.iterateObject[this.counter]]
      : (this.iterateObject[this.counter] as T[]);
    items.push(this.counter);
    this.counter++;

    if (this.counter <= this.maxLimit) {
      return this.callback(...items).then((r: TReturn) => ({
        done: false,
        value: r,
      }));
    } else {
      return Promise.resolve({ done: true });
    }
  }
}

export const AsyncIterate: Provider<
  IterateFactory<
    PayloadRpc['params'],
    (
      item: PayloadRpc['params'][number],
      index: number
    ) => PayloadRpc['params'][number]
  >
> = {
  provide: ASYNC_ITERATOR_FACTORY,
  useFactory: () => ({
    createIterator(
      iterateObject: PayloadRpc['params'],
      callback: (
        item: PayloadRpc['params'][number],
        index: number
      ) => PayloadRpc['params'][number]
    ) {
      return {
        [Symbol.asyncIterator]: () =>
          new GeneralAsyncIterator(iterateObject, callback),
      };
    },
  }),
};
