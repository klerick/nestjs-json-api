import {
  BadRequestException,
  PipeTransform,
  Injectable,
} from '@nestjs/common';

import {
  DEFAULT_QUERY_PAGE,
  DEFAULT_PAGE_SIZE,
} from '../../../constants';
import {
  PipeTransformMixin,
  FilterOperand,
  SortDirection,
  QueryField,
  QueryParams,
  Filters,
  Entity
} from '../../../types';
import {
  checkQueryParamsSchema,
  isString,
  mixin
} from '../../../helpers';


export function querySchemaMixin(entity: Entity): PipeTransformMixin {
  @Injectable()
  class QuerySchemaMixin implements PipeTransform {
    public async transform(value: any): Promise<QueryParams> {
      const builtQuery = {
        [QueryField.sort]: undefined,
        [QueryField.filter]: undefined,
        [QueryField.include]: undefined,
        [QueryField.page]: {
          number: DEFAULT_QUERY_PAGE,
          size: DEFAULT_PAGE_SIZE,
        }
      };

      if (!value) {
        return builtQuery;
      }

      if (value[QueryField.filter]) {
        builtQuery[QueryField.filter] = Object
          .entries(value[QueryField.filter])
          .reduce<Filters>((accum, [field, value]: [string, any]) => {
            if (
              value[FilterOperand.in] ||
              value[FilterOperand.nin] ||
              value[FilterOperand.some]
            ) {
              accum[field] = Object.entries(value).reduce(
                (acum, [op, filed]: [string, string]) => {
                  acum[op] = isString(filed) ? filed.split(',') : [];
                  return acum;
                },
                {}
              );
            } else if (isString(value)) {
              accum[field] = {
                [FilterOperand.eq]: value,
              };
            } else {
              accum[field] = value;
            }
            return accum;
          }, {});
      }

      if (value[QueryField.include] && isString(value[QueryField.include])) {
        builtQuery[QueryField.include] = value[QueryField.include].split(',');
      }

      if (value[QueryField.sort] && isString(value[QueryField.sort])) {
        builtQuery[QueryField.sort] = value[QueryField.sort].split(',')
          .reduce((acum, field) => {
            const fieldName = field.charAt(0) === '-' ? field.substring(1) : field;
            const sortType = field.charAt(0) === '-' ? SortDirection.DESC : SortDirection.ASC;
            acum[fieldName] = sortType;
            return acum;
          }, {});
      }

      if (value[QueryField.page]) {
        const { number, size } = value[QueryField.page];
        if (number) {
          builtQuery[QueryField.page].number = parseInt(number, 10);
        } else {
          builtQuery[QueryField.page].number = DEFAULT_QUERY_PAGE;
        }
        if (size) {
          builtQuery[QueryField.page].size = parseInt(size, 10);
        } else {
          builtQuery[QueryField.page].size = DEFAULT_PAGE_SIZE;
        }
      }

      const errors = await checkQueryParamsSchema(builtQuery);
      if (errors.length > 0) {
        throw new BadRequestException(errors);
      }

      return {
        [QueryField.include]: builtQuery[QueryField.include] || [],
        [QueryField.filter]: builtQuery[QueryField.filter] || {},
        [QueryField.sort]: builtQuery[QueryField.sort] || {},
        [QueryField.page]: builtQuery[QueryField.page]
      };
    }
  }

  return mixin(QuerySchemaMixin);
}

