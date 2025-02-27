import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from '../../../constants';
import { EntityControllerParam } from '../types';
import { ValidateQueryError } from '../../../types';
import { HttpExceptionOptions } from '@nestjs/common/exceptions/http.exception';

@Injectable()
export class ErrorFormatService {
  @Inject(MODULE_OPTIONS_TOKEN) private config!: EntityControllerParam;
  private defaultErrorMsg = 'Internal Server Error';
  formatError(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    const errMessage =
      error instanceof Error
        ? this.config.debug
          ? error.message
          : this.defaultErrorMsg
        : this.defaultErrorMsg;

    const errorObject: ValidateQueryError = {
      code: 'internal_error',
      message: errMessage,
      path: [],
    };

    const descriptionOrOptions: HttpExceptionOptions = this.config.debug
      ? {
          description: this.defaultErrorMsg,
          cause: error instanceof Error ? error : undefined,
        }
      : {
          description: this.defaultErrorMsg,
        };
    return new InternalServerErrorException(
      [errorObject],
      descriptionOrOptions
    );
  }
}
