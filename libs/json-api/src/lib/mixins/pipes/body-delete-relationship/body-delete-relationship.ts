import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import {
  UnprocessableEntityException,
  PipeTransform,
  Injectable,
  Inject,
} from '@nestjs/common';

import { PARAMS_RELATION_NAME } from '../../../constants';
import { mixin } from '../../../helpers/mixin';
import {
  RequestRelationshipsData,
  PipeTransformMixin,
  ValidationError,
  RepositoryMixin,
  Entity
} from '../../../types';
import {
  checkRelationBodyStructure,
  checkRelationDataBasicInfo,
  checkRelationDataType,
} from '../../../helpers';


export function bodyDeleteRelationshipMixin(entity: Entity, connectionName: string): PipeTransformMixin {
  @Injectable()
  class BodyDeleteRelationshipMixin implements PipeTransform {
    @InjectRepository(entity, connectionName) protected repository: RepositoryMixin;
    @Inject(REQUEST) private request: Request;

    public async transform(value: any): Promise<RequestRelationshipsData> {
      const bodyErrors = await checkRelationBodyStructure(value);
      if (bodyErrors.length > 0) {
        throw new UnprocessableEntityException(bodyErrors);
      }

      const relationNameParam = this.request.params[PARAMS_RELATION_NAME];
      const relationMetadata = this.repository.metadata.relations.find(
        relation => relation.propertyName === relationNameParam
      );

      const generalErrors: ValidationError[] = [];
      generalErrors.push(
        ...await checkRelationDataBasicInfo(
          value,
          relationMetadata,
        )
      );
      generalErrors.push(
        ...await checkRelationDataType(
          value,
          relationMetadata,
        )
      );
      if (generalErrors.length > 0) {
        throw new UnprocessableEntityException(generalErrors);
      }

      return value;
    }
  }

  return mixin(BodyDeleteRelationshipMixin);
}

