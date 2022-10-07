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

export class QuerySchemaPipe implements PipeTransform {
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

  private getErrorMsg(field: string | keyof QuerySchemaTypes): string {
    switch (field) {
      case 'fields': {
        const fieldArray = Object.keys(
          this.validateFunction.schema['properties']['fields']['properties']
        );
        return `Incorrect props in fields object of query. For resource "${getEntityName(
          this.repository.target
        )}" allow "fields" of query params "${fieldArray.join(',')}"`;
      }
      case 'filter': {
        return `Incorrect object filter in query`;
      }
      case 'include': {
        return `Should be list field by comma`;
      }
      case 'sort': {
        return `Should be list field by comma`;
      }
      case 'page': {
        return `Incorrect object page in query`;
      }
    }
  }

  async transform(value: unknown): Promise<QuerySchemaTypes> {
    const validate = this.validateFunction(value);
    if (validate) {
      return value as QuerySchemaTypes;
    }
    const errors: Record<string, ValidationError> = {};
    for (const error of this.validateFunction.errors) {
      const parameterParts = error.instancePath
        .split('/')
        .filter((value) => value !== '');
      errors[parameterParts[0]] = {
        source: { parameter: parameterParts[0] },
        detail: this.getErrorMsg(parameterParts[0]),
      };
    }
    throw new BadRequestException(Object.values(errors));
  }
}
