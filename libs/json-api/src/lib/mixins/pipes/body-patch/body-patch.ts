import { InjectRepository } from '@nestjs/typeorm';
import {
  UnprocessableEntityException,
  PipeTransform,
  Injectable,
  Inject
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { PARAMS_RESOURCE_ID } from '../../../constants';
import { mixin } from '../../../helpers/mixin';
import {
  checkClassValidatorFields,
  checkResourceRelationsType,
  checkResourceRelationsData,
  checkResourceBodyStructure
} from '../../../helpers';
import {
  RequestResourceData,
  PipeTransformMixin,
  RepositoryMixin,
  ValidationError,
  Entity
} from '../../../types';


export function bodyPatchMixin(entity: Entity, connectionName: string): PipeTransformMixin {
  @Injectable()
  class BodyPatchMixin implements PipeTransform {
    @InjectRepository(entity, connectionName) protected repository: RepositoryMixin;
    @Inject(REQUEST) private request: Request;

    public async transform(value: any): Promise<RequestResourceData> {
      const resourceMetadata = this.repository.metadata;
      const bodyErrors = await checkResourceBodyStructure(
        value, resourceMetadata, true, true,
      );
      if (bodyErrors.length > 0) {
        throw new UnprocessableEntityException(bodyErrors);
      }
      if (this.request.params[PARAMS_RESOURCE_ID] !== value.id) {
        throw new UnprocessableEntityException({
          source: { pointer: '/data/id' },
          detail: "Data 'id' must be equal to url param",
        });
      }

      const generalErrors: ValidationError[] = [];
      generalErrors.push(
        ...await checkClassValidatorFields(
          value,
          resourceMetadata
        )
      );
      if (!value.relationships) {
        if (generalErrors.length > 0) {
          throw new UnprocessableEntityException(generalErrors);
        }

        return value;
      }

      generalErrors.push(
        ...await checkResourceRelationsType(
          value,
          resourceMetadata,
          false
        )
      );
      if (generalErrors.length > 0) {
        throw new UnprocessableEntityException(generalErrors);
      }
      generalErrors.push(
        ...await checkResourceRelationsData(
          value,
          resourceMetadata,
          false
        )
      );
      if (generalErrors.length > 0) {
        throw new UnprocessableEntityException(generalErrors);
      }

      return value;
    }
  }

  return mixin(BodyPatchMixin);
}

