import {
  KEY_MAIN_INPUT_SCHEMA,
  KEY_MAIN_OUTPUT_SCHEMA,
  Operation,
  ResourceObject,
} from '@klerick/json-api-nestjs-shared';
import { AtomicMainOperations } from './atomic-operation';

export type BodyType = {
  op: Operation;
  ref: {
    type: string;
    id?: string;
    relationship?: string;
    tmpId?: string;
  };
  data?: any;
};

export type AtomicBody = {
  [KEY_MAIN_INPUT_SCHEMA]: BodyType[];
};
export type AtomicResponse<R extends unknown[]> = {
  [KEY_MAIN_OUTPUT_SCHEMA]: {
    [K in keyof R]: R[K] extends object ? ResourceObject<R[K]> : never;
  };
};

export type AtomicVoidOperation = {
  [K in keyof AtomicMainOperations<[]>]: (...arg: any) => void;
};
