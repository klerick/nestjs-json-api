import { InjectRepository } from '@nestjs/typeorm';
import { EntityMetadata } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import {
  BadRequestException,
  PipeTransform,
  Injectable,
  Inject,
} from '@nestjs/common';

import { PARAMS_RELATION_NAME } from '../../../constants';
import { mixin } from '../../../helpers/mixin';
import {
  checkResourceRelationName,
  checkQueryIncludeParam,
  checkQueryFilterParam,
  checkQuerySortParam,
} from '../../../helpers';
import {
  PipeTransformMixin,
  RepositoryMixin,
  ValidationError,
  QueryParams,
  Entity,
} from '../../../types';


export function queryParamsMixin(entity: Entity, connectionName: string): PipeTransformMixin {
  @Injectable()
  class QueryParamsMixin implements PipeTransform {
    @InjectRepository(entity, connectionName) protected repository: RepositoryMixin;
    @Inject(REQUEST) private request: Request;

    public async transform(value: any): Promise<QueryParams> {
      const generalErrors: ValidationError[] = [];

      let metadataRepo: EntityMetadata = this.repository.metadata;
      const relationName = this.request.params[PARAMS_RELATION_NAME];
      if (relationName) {
        generalErrors.push(
          ...await checkResourceRelationName(
            relationName,
            metadataRepo,
          )
        );
        if (generalErrors.length > 0) {
          throw new BadRequestException(generalErrors);
        }

        metadataRepo = metadataRepo.relations.find(relation => {
            return relation.propertyPath === relationName;
        }).inverseEntityMetadata;
      }

      generalErrors.push(
        ...await checkQueryFilterParam(
          value,
          metadataRepo,
        )
      );
      generalErrors.push(
        ...await checkQueryIncludeParam(
          value,
          metadataRepo,
        )
      );
      generalErrors.push(
        ...await checkQuerySortParam(
          value,
          metadataRepo,
        )
      );

      if (generalErrors.length > 0) {
        throw new BadRequestException(generalErrors);
      }

      return value;
    }
  }

  return mixin(QueryParamsMixin);
}

