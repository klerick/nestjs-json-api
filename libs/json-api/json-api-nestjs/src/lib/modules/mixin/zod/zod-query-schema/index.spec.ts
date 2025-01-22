import { FilterOperand, QueryField } from '@klerick/json-api-nestjs-shared';
import { zodQuery } from './index';
import {
  AllFieldWithType,
  ArrayPropsForEntity,
  RelationTree,
  ResultGetField,
  TypeField,
} from '../../types';
import { Users } from '../../../../mock-utils';
import { InputQuery } from '../zod-input-query-schema';
import { ASC } from '../../../../constants';

const userFields: ResultGetField<Users> = {
  field: [
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
  relations: [
    'userGroup',
    'notes',
    'comments',
    'roles',
    'manager',
    'addresses',
  ],
};

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

const propsArray: ArrayPropsForEntity<Users> = {
  target: {
    testArrayNull: true,
    testReal: true,
  },
  addresses: {
    arrayField: true,
  },
  userGroup: {},
  manager: {
    testArrayNull: true,
    testReal: true,
  },
  comments: {},
  notes: {},
  roles: {},
};

const propsType: AllFieldWithType<Users> = {
  updatedAt: TypeField.date,
  testDate: TypeField.date,
  createdAt: TypeField.date,
  isActive: TypeField.boolean,
  lastName: TypeField.string,
  testArrayNull: TypeField.array,
  testReal: TypeField.array,
  firstName: TypeField.string,
  login: TypeField.string,
  id: TypeField.number,
  addresses: {
    arrayField: TypeField.array,
    country: TypeField.string,
    state: TypeField.string,
    city: TypeField.string,
    updatedAt: TypeField.date,
    createdAt: TypeField.date,
    id: TypeField.number,
  },
  manager: {
    updatedAt: TypeField.date,
    testDate: TypeField.date,
    createdAt: TypeField.date,
    isActive: TypeField.boolean,
    lastName: TypeField.string,
    testArrayNull: TypeField.array,
    testReal: TypeField.array,
    firstName: TypeField.string,
    login: TypeField.string,
    id: TypeField.number,
  },
  roles: {
    isDefault: TypeField.boolean,
    key: TypeField.string,
    name: TypeField.string,
    updatedAt: TypeField.date,
    createdAt: TypeField.date,
    id: TypeField.number,
  },
  comments: {
    kind: TypeField.string,
    text: TypeField.string,
    updatedAt: TypeField.date,
    createdAt: TypeField.date,
    id: TypeField.number,
  },
  notes: {
    text: TypeField.string,
    updatedAt: TypeField.date,
    createdAt: TypeField.date,
    id: TypeField.string,
  },
  userGroup: {
    label: TypeField.string,
    id: TypeField.number,
  },
};

const schemaQuery = zodQuery<Users>(
  userFields,
  userRelations,
  propsArray,
  propsType
);

describe('schemaQuery.parse', () => {
  it('should successfully parse valid input', () => {
    const validInput: InputQuery<Users> = {
      [QueryField.fields]: {
        target: [
          'id',
          'login',
          'firstName',
          'lastName',
          'createdAt',
          'updatedAt',
        ],
      },
      [QueryField.filter]: { relation: null, target: null },
      [QueryField.include]: ['roles'],
      [QueryField.sort]: { target: { id: ASC } },
      [QueryField.page]: { number: 1, size: 10 },
    };

    expect(() => schemaQuery.parse(validInput)).not.toThrow();
    const result = schemaQuery.parse(validInput);
    expect(result).toEqual(validInput);
  });

  it('should throw an error for invalid field values', () => {
    const invalidInput = {
      field: ['invalidField'], // Field not defined in userFields
      relations: {
        comments: ['text', 'id'],
      },
    };

    expect(() => schemaQuery.parse(invalidInput)).toThrow();
  });

  it('should throw an error if a required relation field is missing', () => {
    const invalidInput = {
      field: ['updatedAt', 'createdAt', 'login'],
      relations: {}, // Missing required relations
    };

    expect(() => schemaQuery.parse(invalidInput)).toThrowError(/invalid_type/i);
  });

  it('should handle nested relations', () => {
    const validInput: InputQuery<Users> = {
      [QueryField.fields]: {
        target: [
          'id',
          'login',
          'firstName',
          'lastName',
          'createdAt',
          'updatedAt',
        ],
      },
      [QueryField.filter]: {
        relation: null,
        target: {
          id: {
            [FilterOperand.in]: ['1', '2', '3'],
          },
        },
      },
      [QueryField.include]: ['roles'],
      [QueryField.sort]: { target: { id: ASC } },
      [QueryField.page]: { number: 1, size: 10 },
    };

    expect(() => schemaQuery.parse(validInput)).not.toThrow();
    const result = schemaQuery.parse(validInput);
    expect(result).toEqual(validInput);
  });

  it('should throw an error for invalid nested relations', () => {
    const invalidInput = {
      field: ['id', 'login'],
      relations: {
        manager: {
          field: ['id', 'nonExistentField'],
          relations: {
            roles: ['id', 'name'],
          },
        },
      },
    };

    expect(() => schemaQuery.parse(invalidInput)).toThrow();
  });
});
