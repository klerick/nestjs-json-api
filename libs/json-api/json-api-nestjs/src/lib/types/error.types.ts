import { z } from 'zod';

export type InnerErrorType =
  | 'invalid_arguments'
  | 'unrecognized_keys'
  | 'internal_error'
  | 'invalid_intersection_types';

export type InnerError = {
  code: InnerErrorType;
  message: string;
  path: string[];
  keys?: string[];
  error?: Error;
};

export type ValidateQueryError = z.core.$ZodIssue | InnerError;
