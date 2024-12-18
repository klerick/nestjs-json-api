import {
  InternalServerErrorException,
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { QueryFailedError, Repository } from 'typeorm';
import { DriverUtils } from 'typeorm/driver/DriverUtils';

import {
  CONTROL_OPTIONS_TOKEN,
  CURRENT_ENTITY_REPOSITORY,
} from '../../constants';
import { ConfigParam, Entity, ValidateQueryError } from '../../types';
import {
  MysqlError,
  MysqlErrorCode,
  PostgresError,
  PostgresErrorCode,
} from '../../helper';
import { HttpException } from '@nestjs/common';

@Injectable()
export class ErrorInterceptors<E extends Entity> implements NestInterceptor {
  @Inject(CURRENT_ENTITY_REPOSITORY) private repository!: Repository<E>;
  @Inject(CONTROL_OPTIONS_TOKEN) private config!: ConfigParam;

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof QueryFailedError) {
          return throwError(() => this.prepareDataBaseError(error));
        }

        if (error instanceof HttpException) {
          return throwError(() => error);
        }

        const errorObject: ValidateQueryError = {
          code: 'internal_error',
          message: this.config.debug ? error.message : 'Internal Server Error',
          path: [],
        };
        const descriptionOrOptions = this.config.debug ? error : undefined;
        return throwError(
          () =>
            new InternalServerErrorException(
              [errorObject],
              descriptionOrOptions
            )
        );
      })
    );
  }

  private prepareDataBaseError(error: QueryFailedError): HttpException {
    const errorObject: ValidateQueryError = {
      code: 'internal_error',
      message: this.config.debug ? error.message : 'Internal Server Error',
      path: [],
    };

    if (DriverUtils.isMySQLFamily(this.repository.manager.connection.driver)) {
      const { errorCode, errorMsg } = this.prepareMysqlError(error.driverError);
      if (MysqlError[errorCode]) {
        return MysqlError[errorCode](this.repository.metadata, errorMsg);
      }
    }

    if (
      DriverUtils.isPostgresFamily(this.repository.manager.connection.driver)
    ) {
      const { errorCode, errorMsg, detail } = this.preparePostgresError(
        error.driverError
      );

      if (PostgresError[errorCode]) {
        return PostgresError[errorCode](
          this.repository.metadata,
          errorMsg,
          detail
        );
      }
    }

    return new InternalServerErrorException([errorObject]);
  }

  private prepareMysqlError(error: any): {
    errorCode: MysqlErrorCode;
    errorMsg: string;
  } {
    return {
      errorCode: error.errno,
      errorMsg: error.message,
    };
  }

  private preparePostgresError(error: any): {
    errorCode: PostgresErrorCode;
    errorMsg: string;
    detail: string;
  } {
    return {
      errorCode: error.code,
      errorMsg: error.message,
      detail: error.detail,
    };
  }
}
