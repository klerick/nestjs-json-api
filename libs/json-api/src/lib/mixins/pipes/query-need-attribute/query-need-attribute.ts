import { mixin } from '../../../helpers/mixin';
import { Entity, PipeTransformMixin } from '../../../types';
import { Injectable, PipeTransform } from '@nestjs/common';

export function queryNeedAttributeMixin(entity: Entity): PipeTransformMixin {
  @Injectable()
  class QueryNeedAttribute implements PipeTransform {
    transform(value: Record<string, unknown>): {needAttribute: boolean} {
      const result = Object.prototype.hasOwnProperty.call(value,'need-attribute') ? !!value['need-attribute'] : false;

      return {
        needAttribute: result
      };
    }
  }

  return mixin(QueryNeedAttribute);
}
