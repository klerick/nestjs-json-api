import {PipeTransform} from '@nestjs/common';
import {Repository} from 'typeorm';

import {
  Entity as EntityClassOrSchema,
  QueryParams,
  QuerySchemaTypes,
  QueryField,
  Filter,
  FilterOperand, Includes
} from '../../../types';

import { isString } from '../../../helper';

import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUERY_PAGE
} from '../../../constants';


function convertToFilterObject(value: Record<string, string> | string): Partial<{
  [key in FilterOperand]: string
}> {

  if (isString<Record<string, string> | string, string>(value)) {
    return {
      [FilterOperand.eq]: value,
    };
  } else {
    const arrayOp = {
      [FilterOperand.in]: true,
      [FilterOperand.nin]: true,
      [FilterOperand.some]: true,
    }
    return Object.entries(value).reduce((acum, [op, filed]) => {
      if (arrayOp[op]) {
        acum[op] = (isString(filed) ? filed.split(',') : []).filter(i => !!i);
      } else {
        acum[op] = filed;
      }
      return acum;
    }, {})
  }
}

export class QueryTransformPipe<Entity extends EntityClassOrSchema>  implements PipeTransform {

  constructor(
    private repository: Repository<Entity>,
  ) {}


  async transform(value: QuerySchemaTypes): Promise<QueryParams<Entity>> {
    const builtQuery: QueryParams<Entity> = {
      [QueryField.sort]: null,
      [QueryField.filter]: {
        relation: null,
        target: null
      },
      [QueryField.include]: null,
      [QueryField.page]: {
        number: DEFAULT_QUERY_PAGE,
        size: DEFAULT_PAGE_SIZE,
      },
      [QueryField.fields]: null,
      [QueryField.needAttribute]: false
    };

    if (!value) {
      return builtQuery;
    }
    builtQuery['needAttribute'] = !!value['needAttribute'];

    if (value[QueryField.filter]) {
      builtQuery['filter'] = Object
        .entries(value[QueryField.filter])
        .reduce<Filter<Entity>>((accum, [field, value]: [string, any]) => {
          const objectOperand = convertToFilterObject(value);
          if (Object.keys(objectOperand).length === 0) {
            return accum;
          }

          if (field.indexOf('.') > -1) {
            const [relation, fieldRelation] = field.split('.');
            accum['relation'] = !accum['relation'] ? {} : accum['relation'];
            accum['relation'][relation] = accum['relation'][relation] || {};
            accum['relation'][relation][fieldRelation] = objectOperand
          } else {
            accum['target'] = !accum['target'] ? {} : accum['target'];
            accum['target'][field] = objectOperand
          }
          return accum;
        }, {relation: null, target: null});
    }

    if (value[QueryField.include] && isString<null | string, string>(value[QueryField.include])) {
      builtQuery[QueryField.include] = value[QueryField.include]
        .split(',')
        .map(i => i.trim())
        .filter(i => !!i) as Includes<Entity>;
    }

    if (value[QueryField.fields]) {
      builtQuery[QueryField.fields] = Object.entries(value[QueryField.fields]).reduce((acum, [key, value]) => {
        acum[key] = value.split(',').map(i => i.trim()).filter(i => !!i);
        return acum;
      }, {})
    }

    if (value[QueryField.sort] && isString(value[QueryField.sort])) {
      builtQuery[QueryField.sort] = value[QueryField.sort].split(',')
        .map(i => i.trim())
        .filter(i => !!i)
        .reduce((acum, field) => {
          const fieldName = field.charAt(0) === '-' ? field.substring(1) : field;
          const sort = field.charAt(0) === '-' ? 'DESC' : 'ASC';
          if (fieldName.indexOf('.') > -1) {
            const [relation, fieldRelation] = field.split('.');
            const relationName = relation.charAt(0) === '-' ? relation.substring(1) : relation
            acum[relationName] = acum[relation] || {};
            acum[relationName][fieldRelation] = sort
          } else {
            acum['target'] = acum['target'] || {};
            acum['target'][fieldName] = sort
          }
          return acum;
        }, {});
    }

    if (value[QueryField.page]) {
      const { number, size } = value[QueryField.page];
      const sizeParse = parseInt(size, 10);
      const numberParse = parseInt(number, 10);
      if (number && !isNaN(numberParse)) {
        builtQuery[QueryField.page].number = numberParse;
      }

      if (size && !isNaN(sizeParse)) {
        builtQuery[QueryField.page].size = sizeParse;
      }
    }
    return builtQuery;
  }


}
