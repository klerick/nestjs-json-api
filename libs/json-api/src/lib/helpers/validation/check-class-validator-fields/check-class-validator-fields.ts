import { Type } from '@nestjs/common/interfaces/type.interface';
import { validate } from 'class-validator';
import { EntityMetadata } from 'typeorm';

import {
  RequestResourceData,
  ValidationError,
} from '../../../types';


export async function checkClassValidatorFields(
  resourceData: RequestResourceData,
  entityMetadata: EntityMetadata,
  isSkipUndefined = true,
): Promise<ValidationError[]> {
  const generalErrors = [];

  const temporaryEntity = new (entityMetadata.target as Type<any>);
  Object
    .entries(resourceData.relationships || {})
    .forEach(([key, val]) => {
      temporaryEntity[key] = val.data;
    });
  Object
    .entries(resourceData.attributes || {})
    .forEach(([key, val]) => {
      temporaryEntity[key] = val;
    });

  const validationErrors = await validate(temporaryEntity, {
    skipUndefinedProperties: isSkipUndefined,
  });
  if (validationErrors.length > 0) {
    validationErrors.forEach(error => {
      Object.values(error.constraints).forEach(message => {
        const relation = entityMetadata.relations.find(
          relation => relation.propertyPath === error.property
        );

        if (!relation) {
          generalErrors.push({
            source: { pointer: `/data/attributes/${error.property}` },
            detail: message,
          });
        } else {
          generalErrors.push({
            source: { pointer: `/data/relationships/${error.property}` },
            detail: message,
          });
        }
      });
    });
  }

  return generalErrors;
}
