import {
  PipeTransform,
  Injectable,
} from '@nestjs/common';

import { mixin } from '../../../helpers/mixin';
import {
  PipeTransformMixin,
  QueryParams, QueryField
} from '../../../types';


export function paramsEscapeMixin(): PipeTransformMixin {
  @Injectable()
  class ParamsEscapeMixin implements PipeTransform {
    public async transform(value: any): Promise<QueryParams> {
      // keyword-fields sorting fix
      const data = {...value};
      const sortFields = Object.keys(data[QueryField.sort]);
      const includeFields = Object.keys(data[QueryField.include]);
      if (sortFields?.length && !includeFields?.length) {
        data[QueryField.sort] = sortFields.reduce((accum, item) => {
          const name = `"${item}"`;
          accum[name] = data[QueryField.sort][item];
          return accum;
        }, {});
      }
      return data;
    }
  }

  return mixin(ParamsEscapeMixin);
}
