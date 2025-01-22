import { Provider } from '@nestjs/common';
import { ASYNC_ITERATOR_FACTORY } from '../constants';

type ParamsInput<R> = R extends (...arg: infer P) => any ? P : never;

type ParamsReturn<R> = R extends (...arg: any) => infer P
  ? P extends Promise<infer T>
    ? T extends [infer K, ...any]
      ? K
      : T
    : P
  : never;

export type IterateFactory<
  R extends (...arg: any) => any = (...arg: any) => any
> = {
  createIterator: (
    iterateObject: ParamsInput<R>,
    callback: R
  ) => {
    [Symbol.asyncIterator](): GeneralAsyncIterator<
      R,
      ParamsInput<R>,
      ParamsReturn<R>
    >;
  };
};

class GeneralAsyncIterator<
  R extends (...arg: any[]) => any,
  T = ParamsInput<R>,
  TReturn = ParamsReturn<R>
> implements AsyncIterator<T, TReturn>
{
  private counter = 0;
  private maxLimit!: number;

  constructor(private iterateObject: T[], private callback: R) {
    if (!Array.isArray(iterateObject)) {
      throw new Error('Expected iterateObject to be an array');
    }
    this.maxLimit = iterateObject.length;
  }

  async next(): Promise<IteratorResult<T, TReturn>> {
    const items = !Array.isArray(this.iterateObject[this.counter])
      ? [this.iterateObject[this.counter]]
      : (this.iterateObject[this.counter] as T[]);
    this.counter++;

    if (this.counter <= this.maxLimit) {
      return this.callback(...items).then((r: TReturn) => ({
        done: false,
        value: r,
      }));
    } else {
      return Promise.resolve({ done: true, value: {} as TReturn });
    }
  }
}

export const AsyncIterate: Provider<IterateFactory> = {
  provide: ASYNC_ITERATOR_FACTORY,
  useFactory: () => ({
    createIterator<R extends (...arg: any) => any>(
      iterateObject: ParamsInput<R>,
      callback: R
    ) {
      return {
        [Symbol.asyncIterator]: () =>
          new GeneralAsyncIterator(iterateObject, callback),
      };
    },
  }),
};
