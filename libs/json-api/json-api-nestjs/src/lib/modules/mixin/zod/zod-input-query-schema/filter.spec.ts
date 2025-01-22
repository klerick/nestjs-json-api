import { zodFilterInputQuery } from './filter';
import { Users } from '../../../../mock-utils';
import { RelationTree, ResultGetField } from '../../types';

const userFields: ResultGetField<Users>['field'] = [
  'updatedAt',
  'testDate',
  'createdAt',
  'isActive',
  'lastName',
  'testArrayNull',
  'testReal',
  'firstName',
  'login',
  'id',
];

const userRelations: RelationTree<Users> = {
  addresses: [
    'arrayField',
    'country',
    'state',
    'city',
    'updatedAt',
    'createdAt',
    'id',
  ],
  manager: [
    'updatedAt',
    'testDate',
    'createdAt',
    'isActive',
    'lastName',
    'testArrayNull',
    'testReal',
    'firstName',
    'login',
    'id',
  ],
  roles: ['isDefault', 'key', 'name', 'updatedAt', 'createdAt', 'id'],
  comments: ['kind', 'text', 'updatedAt', 'createdAt', 'id'],
  notes: ['text', 'updatedAt', 'createdAt', 'id'],
  userGroup: ['label', 'id'],
};

describe('zodFilterInputQuery', () => {
  it('should return transformed result with relation and target when valid data is provided', () => {
    const schema = zodFilterInputQuery(userFields, userRelations);
    const input = {
      login: { eq: 'johndoe' },
      addresses: { eq: 'null' },
      manager: { eq: null },
      userGroup: { ne: null },
      'addresses.city': { eq: 'New York' },
    };

    const result = schema.parse(input);

    expect(result).toEqual({
      relation: {
        addresses: { city: { eq: 'New York' } },
      },
      target: {
        addresses: { eq: null },
        manager: { eq: null },
        login: { eq: 'johndoe' },
        userGroup: { ne: null },
      },
    });
  });

  it('should return null relation and target when no data is provided', () => {
    const schema = zodFilterInputQuery(userFields, userRelations);

    const result = schema.parse({});
    expect(result).toEqual({ relation: null, target: null });
  });

  it('should ignore invalid fields and not include them in the result', () => {
    const schema = zodFilterInputQuery(userFields, userRelations);
    const input = {
      invalidField: { eq: 'should be ignored' },
      login: { eq: 'johndoe' },
    };

    const result = schema.parse(input);

    expect(result).toEqual({
      relation: null,
      target: { login: { eq: 'johndoe' } },
    });
  });

  it('should handle nested relations correctly', () => {
    const schema = zodFilterInputQuery(userFields, userRelations);
    const input = {
      'manager.firstName': { like: 'Jane' },
      'manager.lastName': { nin: 'Doe,Jim' },
    };

    const result = schema.parse(input);

    expect(result).toEqual({
      relation: {
        manager: {
          firstName: { like: 'Jane' },
          lastName: { nin: ['Doe', 'Jim'] },
        },
      },
      target: null,
    });
  });

  it('should throw a validation error for invalid structures', () => {
    const schema = zodFilterInputQuery(userFields, userRelations);

    const invalidInput = {
      login: { unknownOperator: 'invalid' },
    };

    expect(() => schema.parse(invalidInput)).toThrow();
  });
});
