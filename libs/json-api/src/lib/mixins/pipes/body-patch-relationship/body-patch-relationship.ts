import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import {
  PipeTransform,
  Injectable,
  Inject, UnprocessableEntityException
} from '@nestjs/common';


import { PARAMS_RELATION_NAME } from '../../../constants';
import { mixin } from '../../../helpers/mixin';
import {
  RequestRelationshipsData,
  PipeTransformMixin,
  RepositoryMixin,
  ValidationError,
  Entity
} from '../../../types';
import {
  checkRelationDataBasicInfo,
  checkRelationBodyStructure,
  checkRelationDataType,
} from '../../../helpers';


export function bodyPatchRelationshipMixin(entity: Entity, connectionName: string): PipeTransformMixin {
  @Injectable()
  class BodyPatchRelationshipMixin implements PipeTransform {
    @InjectRepository(entity, connectionName) protected repository: RepositoryMixin;
    @Inject(REQUEST) private request: Request;

    public async transform(value: any): Promise<RequestRelationshipsData> {
      const bodyErrors = await checkRelationBodyStructure(value, true);
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
          false,
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

  return mixin(BodyPatchRelationshipMixin);
}

