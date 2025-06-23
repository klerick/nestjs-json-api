import {
  ErrorFormatService,
  ValidateQueryError,
  PrepareParams,
  MODULE_OPTIONS_TOKEN,
} from '@klerick/json-api-nestjs';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  HttpExceptionOptions,
} from '@nestjs/common';

import {
  DriverException,
  EntityManager,
  UniqueConstraintViolationException,
  ValidationError,
} from '@mikro-orm/core';

import { CURRENT_ENTITY_MANAGER_TOKEN } from '../constants';

const duplicateItems = (
  errorText: string,
  options: HttpExceptionOptions,
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
    message: errorText,
    path: ['data', 'attributes'],
  };

  return new ConflictException([error], options);
};

export class MikroOrmFormatErrorService extends ErrorFormatService {
  @Inject(CURRENT_ENTITY_MANAGER_TOKEN) em!: EntityManager;
  @Inject(MODULE_OPTIONS_TOKEN)
  private mainConfig!: PrepareParams;

  private errorMsg = 'Internal Server Error';

  override formatError(error: unknown): HttpException {
    try {
      if (error instanceof ValidationError) {
        return this.formatValidationError(error);
      }
      if (error instanceof DriverException) {
        return this.prepareDataBaseError(error);
      }
      return super.formatError(error);
    } catch (error) {
      return super.formatError(error);
    }
  }

  private formatValidationError(error: ValidationError) {
    const { message } = error;

    const entity = error.getEntity();
    const errorObject: ValidateQueryError = {
      code: 'invalid_arguments',
      message: message.split('\n').at(0) || message,
      path: [],
    };
    if (entity) {
      errorObject['path'] = ['data', 'attributes'];
    }

    const descriptionOrOptions: HttpExceptionOptions = this.mainConfig.options
      .debug
      ? { cause: error }
      : {};

    return new BadRequestException([errorObject], descriptionOrOptions);
  }

  private prepareDataBaseError(error: DriverException) {
    if (
      !this.em
        .getPlatform()
        .getConfig()
        .getDriver()
        .constructor.name.startsWith('Postgre')
    ) {
      return super.formatError(error);
    }

    const { errorCode, errorMsg, detail, table } = {
      errorCode: error.code,
      errorMsg: error.message,
      detail: Reflect.get(error, 'detail') as string,
      table: Reflect.get(error, 'table') as string,
    };
    const descriptionOrOptions: HttpExceptionOptions = this.mainConfig.options
      .debug
      ? { cause: error }
      : {};

    switch (error.constructor) {
      case UniqueConstraintViolationException:
        return duplicateItems(errorMsg, descriptionOrOptions, detail);
      default:
        return super.formatError(error);
    }
  }
}
