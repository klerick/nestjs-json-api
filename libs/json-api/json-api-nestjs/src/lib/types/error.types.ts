import { ZodIssue } from 'zod';

export type InnerErrorType =
  | 'invalid_arguments'
  | 'unrecognized_keys'
  | 'internal_error';

export type InnerError = {
  code: InnerErrorType;
  message: string;
  path: string[];
  keys?: string[];
  error?: Error;
};

export type ValidateQueryError = ZodIssue | InnerError;

export type ErrorDescribe = ValidateQueryError;
