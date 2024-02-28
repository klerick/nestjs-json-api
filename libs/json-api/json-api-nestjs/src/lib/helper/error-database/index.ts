import { EntityMetadata } from 'typeorm';
import { ValidateQueryError } from '../../types';

import { formErrorString } from './utils';
import {
  BadRequestException,
  ConflictException,
  NotAcceptableException,
} from '@nestjs/common';

const fieldNotNullOrDefault = (
  entityMetadata: EntityMetadata,
  errorText: string,
  detail?: string
) => {
  const error: ValidateQueryError = {
    code: 'invalid_arguments',
    message: formErrorString(entityMetadata, errorText),
    path: ['data', 'attributes'],
  };

  return new BadRequestException([error]);
};

const duplicateItems = (
  entityMetadata: EntityMetadata,
  errorText: string,
  detail?: string
) => {
  errorText = 'Duplicate value';
  if (detail) {
    const matches = detail.match(/(?<=\().+?(?=\))/gm);
    if (matches) {
      errorText = `Duplicate value in the "${matches[0]}"`;
    }
  }

  const error: ValidateQueryError = {
    code: 'invalid_arguments',
    message: detail ? formErrorString(entityMetadata, errorText) : errorText,
    path: ['data', 'attributes'],
  };

  return new ConflictException([error]);
};

const invalidInputSyntax = (
  entityMetadata: EntityMetadata,
  errorText: string,
  detail?: string
) => {
  const error: ValidateQueryError = {
    code: 'invalid_arguments',
    message: errorText,
    path: [],
  };
  return new BadRequestException([error]);
};

const entityHasRelation = (
  entityMetadata: EntityMetadata,
  errorText: string,
  detail?: string
) => {
  const error: ValidateQueryError = {
    code: 'invalid_arguments',
    message: detail || errorText,
    path: ['data', 'attributes'],
  };
  return new NotAcceptableException([error]);
};

export const MysqlError = {
  [1364]: fieldNotNullOrDefault,
  [1062]: duplicateItems,
  [1525]: invalidInputSyntax,
};

export const PostgresError = {
  [23502]: fieldNotNullOrDefault,
  [23505]: duplicateItems,
  ['22P02']: invalidInputSyntax,
  [22007]: invalidInputSyntax,
  [22003]: invalidInputSyntax,
  [23503]: entityHasRelation,
};

export type PostgresErrorCode = keyof typeof PostgresError;
export type MysqlErrorCode = keyof typeof MysqlError;
