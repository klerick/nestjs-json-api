import { ValueProvider } from '@nestjs/common';
import { MAP_HANDLER } from '../constants';

export const mapHandlerStoreProvider: ValueProvider = {
  provide: MAP_HANDLER,
  useValue: new Map(),
};
