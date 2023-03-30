import { BadRequestException, Inject, PipeTransform } from '@nestjs/common';
import { Repository } from 'typeorm';
import AjvCall, { ValidateFunction } from 'ajv';

import { getEntityName } from '../../../helper';
import {
  Entity,
  PipeMixin,
  QuerySchemaTypes,
  ValidationError,
} from '../../../types';
import { isNumberString, isUUID } from 'class-validator';

export class IdSchemaPipe implements PipeTransform {
  protected validateFunction: ValidateFunction<QuerySchemaTypes>;
  static inject(pip: PipeMixin): void {
    Inject(AjvCall)(pip, 'ajvCall', 1);
  }

  constructor(
    protected repository: Repository<Entity>,
    protected ajvCall: AjvCall
  ) {
    const schemaName = getEntityName(this.repository.target);
    this.validateFunction = this.ajvCall.getSchema(
      `inputQuerySchema-${schemaName}`
    );
  }

  async transform(value: unknown): Promise<QuerySchemaTypes> {
    const resource = getEntityName(this.repository.target);
    const columns = this.repository.metadata.columns;

    for (const column of columns) {
      if (column.propertyName === 'id') {
        const isUuuidColumn = column.generationStrategy === 'uuid';

        const valid = isUuuidColumn ? isUUID(value) : isNumberString(value);

        if (!valid) {
          const message = isUuuidColumn
            ? `Id of resource ${resource} should be uuid`
            : `Id of resource ${resource} should be numeric string`;
          throw new BadRequestException(message);
        }
      }
    }

    return value as QuerySchemaTypes;
  }
}
