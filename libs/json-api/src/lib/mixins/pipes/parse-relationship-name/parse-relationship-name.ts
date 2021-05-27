import { InjectRepository } from '@nestjs/typeorm';
import {
  UnprocessableEntityException,
  PipeTransform,
  Injectable,
} from '@nestjs/common';

import { checkResourceRelationName } from '../../../helpers';
import { mixin } from '../../../helpers/mixin';
import {
  PipeTransformMixin,
  RepositoryMixin,
  Entity
} from '../../../types';


export function parseRelationshipNameMixin(entity: Entity, connectionName: string): PipeTransformMixin {
  @Injectable()
  class ParseRelationshipNameMixin implements PipeTransform {
    @InjectRepository(entity, connectionName) protected repository: RepositoryMixin;

    public async transform(value: string): Promise<string> {
      const generalErrors = await checkResourceRelationName(value, this.repository.metadata);

      if (generalErrors.length > 0) {
        throw new UnprocessableEntityException(generalErrors);
      }

      return value;
    }
  }

  return mixin(ParseRelationshipNameMixin);
}

