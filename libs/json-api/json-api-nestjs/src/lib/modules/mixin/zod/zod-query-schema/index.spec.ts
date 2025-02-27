import { FilterOperand, QueryField } from '@klerick/json-api-nestjs-shared';

import { ASC } from '../../../../constants';
import { usersEntityParamMapMockData } from '../../../../utils/___test___/test.helper';
import { Users } from '../../../../utils/___test___/test-classes.helper';

import { InputQuery } from '../zod-input-query-schema';
import { zodQuery } from './index';

const schemaQuery = zodQuery(usersEntityParamMapMockData);

describe('schemaQuery.parse', () => {
  it('should successfully parse valid input', () => {
    const validInput: InputQuery<Users, 'id'> = {
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
    const validInput: InputQuery<Users, 'id'> = {
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
