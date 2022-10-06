import {Inject, PipeTransform, BadRequestException, Injectable} from '@nestjs/common';
import AjvCall, {ValidateFunction} from 'ajv';
import {ResourceRequestObject} from '../../../types-common/request';
import {ValidationError} from '../../../types';
import {upperFirstLetter} from '../../../helper';
import {Relationship} from '../../../types-common';

@Injectable()
export class BodyRelationshipPipe<Entity> implements PipeTransform{

  protected validateFunction: ValidateFunction<ResourceRequestObject<Entity>>;

  constructor(
    @Inject(AjvCall) protected ajvCall: AjvCall
  ) {
    this.validateFunction = this.ajvCall.getSchema<ResourceRequestObject<Entity>>('body-relationship-schema');
  }

  transform(value: any): ResourceRequestObject<Entity>['data'] {
    const validate = this.validateFunction(value);

    const errorResult: ValidationError[] = [];
    if (!validate) {
      for (const error of this.validateFunction.errors) {
        const errorMsg: string [] = [];
        errorMsg.push(upperFirstLetter(error.message));

        switch (error.keyword){
          case 'enum':
            errorMsg.push(`Allowed values are: "${error.params.allowedValues.join(',')}"`)
            break;
          case 'additionalProperties':
            errorMsg.push(`Additional Property is: "${error.params.additionalProperty}"`)
            break;
          case 'oneOf':
            errorMsg[errorMsg.length - 1] = 'Must match exactly one schema: "object" or "array"'
            break;
        }
        errorResult.push({
          source: {
            parameter: error.instancePath
          },
          detail: errorMsg.join('. ')
        });
      }
    }

    if (errorResult.length > 0) {
      throw new BadRequestException(errorResult);
    }

    return value.data;
  }

}
