import {
  ErrorFormatService,
  EntityParam,
  ValidateQueryError,
  ENTITY_PARAM_MAP,
} from '@klerick/json-api-nestjs';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  NotAcceptableException,
} from '@nestjs/common';
import {
  EntityMetadata,
  QueryFailedError,
  EntityTarget,
  EntityManager,
} from 'typeorm';
import { Driver } from 'typeorm/driver/Driver';
import { DriverUtils } from 'typeorm/driver/DriverUtils';
import { CURRENT_ENTITY_MANAGER_TOKEN } from '../constants';

export const formErrorString = (
  entityMetadata: EntityMetadata,
  errorText: string
) => {
  for (const column of entityMetadata.columns) {
    const result = new RegExp(column.databaseName).test(errorText);
    if (!result) continue;

    errorText = errorText.replace(column.databaseName, column.propertyName);
  }
  return errorText.replace(entityMetadata.tableName, entityMetadata.name);
};

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

export const PostgresError = {
  [23502]: fieldNotNullOrDefault,
  [23505]: duplicateItems,
  ['22P02']: invalidInputSyntax,
  [22007]: invalidInputSyntax,
  [22003]: invalidInputSyntax,
  [23503]: entityHasRelation,
};

export class TypeOrmFormatErrorService extends ErrorFormatService {
  @Inject(CURRENT_ENTITY_MANAGER_TOKEN) private entityManager!: EntityManager;
  @Inject(ENTITY_PARAM_MAP) private readonly mapProperty!: Map<
    EntityTarget<any>,
    EntityParam<any>
  >;
  private _dbDriver: Driver | undefined = undefined;

  get dbDriver(): Driver {
    if (!this._dbDriver) {
      const firstEntity = [...this.mapProperty.keys()].at(0);

      if (!firstEntity) {
        throw new Error('No entity found in map');
      }

      this._dbDriver =
        this.entityManager.getRepository(firstEntity).manager.connection.driver;
    }

    return this._dbDriver;
  }

  override formatError(error: unknown): HttpException {
    if (!(error instanceof QueryFailedError)) {
      return super.formatError(error);
    }
    try {
      return this.prepareDataBaseError(error);
    } catch (error) {
      return super.formatError(error);
    }
  }

  private prepareDataBaseError(error: QueryFailedError): HttpException {
    if (DriverUtils.isPostgresFamily(this.dbDriver)) {
      const { errorCode, errorMsg, detail, table } = {
        errorCode: (error.driverError as any)
          .code as keyof typeof PostgresError,
        errorMsg: error.driverError.message,
        detail: (error.driverError as any).detail,
        table: (error.driverError as any).table,
      };

      const metadata = this.entityManager.connection.entityMetadatas.find(
        (i) => i.tableName === table
      );
      if (!metadata) {
        return super.formatError(error);
      }
      if (PostgresError[errorCode]) {
        return PostgresError[errorCode](metadata, errorMsg, detail);
      }
    }

    return super.formatError(error);
  }
}
