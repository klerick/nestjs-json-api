import { QueryField, ObjectTyped } from '../../../../utils/nestjs-shared';
import { zodInputQuery } from './index';

import { ResultGetField, TupleOfEntityRelation } from '../../types';
import { Users } from '../../../../mock-utils/typeorm';

import {
  userFieldsStructure,
  userRelations,
} from '../../../../utils/___test___/test.helper';

const userFields: ResultGetField<Users>['field'] = userFieldsStructure['field'];

const entityFieldsStructure = {
  field: userFields,
  relations: ObjectTyped.keys(userRelations) as TupleOfEntityRelation<Users>,
};

describe('zodInputQuery', () => {
  it('should validate a correct input query object', () => {
    const schema = zodInputQuery(entityFieldsStructure, userRelations);
    const input = {
      [QueryField.fields]: {
        target: 'login',
        roles: 'name',
        manager: 'firstName',
      },
      [QueryField.filter]: { id: 1 },
      [QueryField.include]: 'manager,roles',
      [QueryField.sort]: 'login',
      [QueryField.page]: { number: 1, size: 10 },
    };
    try {
      schema.parse(input);
    } catch (e) {
      console.log(e);
    }

    expect(() => schema.parse(input)).not.toThrow();
  });

  it('should throw an error for an invalid field in the input query', () => {
    const schema = zodInputQuery(entityFieldsStructure, userRelations);
    const input = {
      [QueryField.fields]: ['invalidRelation.invalidField'],
      [QueryField.filter]: { id: 1 },
      [QueryField.include]: ['addresses'],
      [QueryField.sort]: [{ field: 'login', order: 'asc' }],
      [QueryField.page]: { number: 2, size: 5 },
    };

    expect(() => schema.parse(input)).toThrow();
  });

  it('should throw an error if an unexpected key is present in the input query', () => {
    const schema = zodInputQuery(entityFieldsStructure, userRelations);
    const input = {
      [QueryField.fields]: ['roles.name'],
      [QueryField.filter]: { id: 1 },
      [QueryField.include]: ['roles'],
      [QueryField.sort]: [{ field: 'login', order: 'asc' }],
      [QueryField.page]: { number: 1, size: 10 },
      unexpectedKey: 'unexpectedValue',
    };

    expect(() => schema.parse(input)).toThrow();
  });

  it('should throw an error when a required field is missing', () => {
    const schema = zodInputQuery(entityFieldsStructure, userRelations);
    const input = {
      [QueryField.fields]: ['roles.name'],
      [QueryField.include]: ['roles'],
      [QueryField.sort]: [{ field: 'login', order: 'asc' }],
      [QueryField.page]: { number: 1, size: 10 },
    };

    expect(() => schema.parse(input)).toThrow();
  });

  it('should validate input with empty but valid fields', () => {
    const schema = zodInputQuery(entityFieldsStructure, userRelations);
    const input = {
      [QueryField.page]: { number: 1, size: 10 },
    };

    expect(() => schema.parse(input)).not.toThrow();
    const result = schema.parse(input);

    expect(result).toEqual({
      fields: null,
      filter: { relation: null, target: null },
      include: null,
      sort: null,
      page: { size: 10, number: 1 },
    });
  });
});
