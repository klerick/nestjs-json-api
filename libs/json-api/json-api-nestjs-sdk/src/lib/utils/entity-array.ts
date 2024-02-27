import { PageProps } from '../types';

export class EntityArray<T> extends Array<T> {
  constructor(items: T[], private pageProps: PageProps) {
    super(...items);
    Object.defineProperty(this, 'pageProps', {
      writable: false,
      enumerable: false,
      value: pageProps,
    });
  }

  static override get [Symbol.species]() {
    return Array;
  }

  get totalItems() {
    return this.pageProps.totalItems;
  }

  get pageSize() {
    return this.pageProps.pageSize;
  }

  get pageNumber() {
    return this.pageProps.pageNumber;
  }
}
