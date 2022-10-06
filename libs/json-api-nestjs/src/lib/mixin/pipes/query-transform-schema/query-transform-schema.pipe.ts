
import {BadRequestException, Inject, PipeTransform} from '@nestjs/common';
import {Repository} from 'typeorm';
import AjvCall, {ErrorObject, ValidateFunction} from 'ajv';

import {getEntityName} from '../../../helper';
import {
  FilterOperand,
  PipeMixin,
  QueryParams,
  ValidationError
} from '../../../types';

export class QueryTransformSchemaPipe<Entity> implements PipeTransform {
  protected validateFunction: ValidateFunction<QueryParams<Entity>>;
  protected allowPropsField: string[] = [];
  protected allowPropsFilter: string[] = [];
  protected allowPropsSort: string[] = [];
  protected allowPropsRelationFilter: Record<string, string[]> = {};
  protected allowPropsRelationSort: Record<string, string[]> = {};

  static inject(pip: PipeMixin): void {
    Inject(AjvCall)(pip, 'ajvCall', 1);
  }

  constructor(
    protected repository: Repository<Entity>,
    protected ajvCall: AjvCall
  ) {

    const schemaName = getEntityName(this.repository.target);
    this.validateFunction = this.ajvCall.getSchema(`transformQuerySchema-${schemaName}`);
    this.allowPropsFilter = Object.keys(this.validateFunction.schema['$defs']['filterTarget'].properties)
    this.allowPropsSort = Object.keys(this.validateFunction.schema['$defs']['sortDefs'].properties.target.properties)
    this.allowPropsField = Object.keys(this.validateFunction.schema['$defs']['fieldsDefs'].properties);

    this.allowPropsRelationFilter = this.allowPropsRelationSort = Object.keys(this.validateFunction.schema['$defs'].filterRelation.properties).reduce((acum, item) => {
      acum[item] = Object.keys(this.validateFunction.schema['$defs'].filterRelation.properties[item].properties)
      return acum;
    }, {})

    this.allowPropsRelationSort = Object.keys(this.validateFunction.schema['$defs']['sortDefs'].properties).reduce((acum, item) => {
      acum[item] = Object.keys(this.validateFunction.schema['$defs']['sortDefs'].properties[item].properties)
      return acum;
    }, {})
  }

  async transform(value: QueryParams<Entity>): Promise<QueryParams<Entity>> {
    const validate = this.validateFunction(value);
    if (!validate) {
      throw new BadRequestException(
        this.getErrors(this.validateFunction.errors)
      );
    }

    return value;
  }

  private getErrors(errors: ErrorObject[]): ValidationError[] {
    const errorResult: ValidationError[] = [];
    for (const error of errors) {
      const parameterParts = error.instancePath.split('/').filter(value => value !== '');
      const fields = parameterParts[0];
      let detailMsg = ''
      switch (fields) {
        case 'fields': {
          switch (error.keyword) {
            case 'minProperties':
              detailMsg = error.message;
              break;
            case 'enum':
              detailMsg = `${error.message}. The allowed values are: "${error.params.allowedValues.join(',')}"`;
              break;
            case 'additionalProperties':
              detailMsg = `${error.message}. The allowed properties are: "${this.allowPropsField.join(',')}"`;
              break;
          }
          break;
        }
        case 'filter': {
          if (error.instancePath === '/filter/target' && error.schemaPath === '#/additionalProperties') {
            detailMsg = `${error.message}. The additionalProperty properties is: "${error.params.additionalProperty}"`;
          }
          if (error.keyword === 'maxProperties') {
            detailMsg = `${error.message}. Only one operator allow for field`;
          }

          if ((error.keyword === 'minProperties' || error.keyword === 'type') && error.message !== 'must be null') {
            detailMsg = error.message;
          }
          if (error.schemaPath.indexOf('target/additionalProperties') > -1) {
            detailMsg = `${error.message}. The allowed properties are: "${this.allowPropsFilter.join(',')}"`;
          }

          if (error.schemaPath.indexOf('relation') > -1) {
            if (error.schemaPath.indexOf('relation/additionalProperties') > -1) {
              detailMsg = `${error.message}. The allowed properties are: "${Object.keys(this.allowPropsRelationFilter).join(',')}"`;
            } else if(error.keyword === 'additionalProperties') {
              const relationName = error.instancePath.split('/').pop();
              detailMsg = `${error.message}. The allowed properties for "${relationName}" are: "${this.allowPropsRelationFilter[relationName].join(',')}"`;
            }
          }

          if (error.schemaPath.indexOf('operandForRelationProps') > -1) {
            detailMsg = `Allowed only '${FilterOperand.eq}' and '${FilterOperand.ne}' operands and value only 'null'`;
          }

          if (error.schemaPath.indexOf('operandForArrayProps') > -1) {
            detailMsg = `Incorrect operand '${error.params.additionalProperty}' in array field `;
          }

          if (error.schemaPath.indexOf('operand/additionalProperties') > -1) {
            detailMsg = `Incorrect operand '${error.params.additionalProperty}' in non-array field `;
          }

          break;
        }
        case 'include':{
          if (error.keyword === 'minItems') {
            detailMsg = error.message;
          }
          if (error.keyword === 'enum') {
            detailMsg = `${error.message}. The allowed values are: "${error.params.allowedValues.join(',')}"`;
          }
          break;
        }
        case 'sort':{

          if (error.schemaPath.indexOf('targetResource/additionalProperties') > -1) {
            detailMsg = `${error.message}. The allowed properties are: "${this.allowPropsSort.join(',')}"`;
          }
          if (error.schemaPath === '#/additionalProperties') {
            detailMsg = `${error.message}. The allowed properties are: "${Object.keys(this.allowPropsRelationSort).join(',')}"`;
          }

          if (error.schemaPath === '#/properties/target/additionalProperties') {
            detailMsg = `${error.message}. The allowed properties are: "${this.allowPropsSort.join(',')}"`;
          }

          if (error.keyword === 'enum') {
            detailMsg = `${error.message}. The allowed values are: "${error.params.allowedValues.join(',')}"`;
          }

          if (error.keyword === 'minProperties') {
            detailMsg = `${error.message}`;
          }

          break;
        }
      }

      if (detailMsg) {
        errorResult.push({
          source: {
            parameter: error.instancePath
          },
          detail: detailMsg[0].toUpperCase() + detailMsg.slice(1)
        })
      }

    }

    return errorResult;
  }
}
