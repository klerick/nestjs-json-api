import { ValueProvider } from '@nestjs/common';
import { ZOD_INPUT_DATA } from '../constants';
import { ZPayloadRpc } from '../types';

export const zodInputDataProvider: ValueProvider = {
  provide: ZOD_INPUT_DATA,
  useValue: ZPayloadRpc,
};
