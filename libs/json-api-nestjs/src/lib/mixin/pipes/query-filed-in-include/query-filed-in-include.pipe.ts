import {BadRequestException, PipeTransform} from '@nestjs/common';
import {Repository} from 'typeorm';

import {Entity as EntityClassOrSchema, QueryParams, ValidationError} from '../../../types';


export class QueryFiledInIncludePipe<Entity extends EntityClassOrSchema> implements PipeTransform {
  constructor(
    protected repository: Repository<Entity>,
  ) {
  }
  async transform(value: QueryParams<Entity>): Promise<QueryParams<Entity>> {

    const errors: ValidationError[] = [];
    const includeMap = (value['include'] || []).reduce<
      Partial<Record<QueryParams<Entity>['include'][number], boolean>>
      >((acum, item) => (acum[item]=true, acum), {});


    const {target: targetResourceFields, ...relationFields} = (value['fields'] || {});
    const relationFieldsArray = Object.keys(relationFields);

    if (relationFields && relationFieldsArray.length > 0) {
      errors.push(
        ...relationFieldsArray
          .filter(i => !(includeMap[i] === true))
          .map(i => ({
            detail: `Add '${i}' to query param 'include'`,
            source: {
              parameter: '/fields',
            },
          }))
      )
    }

    const {target: targetResourceSort, ...relationSort} = (value['sort'] || {});
    const relationSortArray = Object.keys(relationSort);
    if (relationSort && Object.keys(relationSortArray).length > 0) {
      errors.push(
        ...relationSortArray
          .filter(i => !(includeMap[i] === true))
          .map(i => ({
            detail: `Add '${i}' to query param 'include'`,
            source: {
              parameter: '/sort',
            },
          }))
      )
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return value;
  }

}
