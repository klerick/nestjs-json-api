import { InjectRepository } from '@nestjs/typeorm';
import {
  UnprocessableEntityException,
  PipeTransform,
  Injectable,
} from '@nestjs/common';

import { mixin } from '../../../helpers/mixin';
import {
  checkResourceRelationsData,
  checkResourceRelationsType,
  checkClassValidatorFields,
  checkResourceBodyStructure,
} from '../../../helpers';
import {
  RequestResourceData,
  PipeTransformMixin,
  ValidationError,
  RepositoryMixin,
  Entity
} from '../../../types';


export function bodyPostMixin(entity: Entity, connectionName: string): PipeTransformMixin {
  @Injectable()
  class BodyPostMixin implements PipeTransform {
    @InjectRepository(entity, connectionName) protected repository: RepositoryMixin;

    public async transform(value: any): Promise<RequestResourceData> {
      const resourceMetadata = this.repository.metadata;
      const bodyErrors = await checkResourceBodyStructure(
        value, resourceMetadata, false, false,
      );
      if (bodyErrors.length > 0) {
        throw new UnprocessableEntityException(bodyErrors);
      }

      const generalErrors: ValidationError[] = [];
      generalErrors.push(
        ...await checkClassValidatorFields(
          value,
          resourceMetadata,
          false
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
          resourceMetadata
        )
      );
      if (generalErrors.length > 0) {
        throw new UnprocessableEntityException(generalErrors);
      }
      generalErrors.push(
        ...await checkResourceRelationsData(
          value,
          resourceMetadata
        )
      );
      if (generalErrors.length > 0) {
        throw new UnprocessableEntityException(generalErrors);
      }
      return value;
    }
  }

  return mixin(BodyPostMixin);
}

