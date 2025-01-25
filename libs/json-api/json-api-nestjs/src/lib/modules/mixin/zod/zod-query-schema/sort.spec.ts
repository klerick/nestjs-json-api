import { zodSortQuery } from './sort';

import { ASC, DESC } from '../../../../constants';

import {
  userFields,
  userRelations,
} from '../../../../utils/___test___/test.helper';

const schema = zodSortQuery(userFields, userRelations);
describe('zodSortQuery', () => {
  it('should create a Zod schema with target and relations', () => {
    const parsedData = schema.parse({
      target: { id: ASC },
      addresses: { country: DESC },
      manager: { lastName: ASC },
      roles: { name: DESC },
      comments: { kind: DESC },
      notes: { text: ASC },
      userGroup: { label: ASC },
    });

    expect(parsedData).toEqual({
      target: { id: ASC },
      addresses: { country: DESC },
      manager: { lastName: ASC },
      roles: { name: DESC },
      comments: { kind: DESC },
      notes: { text: ASC },
      userGroup: { label: ASC },
    });
  });

  it('should throw an error for an invalid field in target', () => {
    const schema = zodSortQuery(userFields, userRelations);

    expect(() => {
      schema.parse({
        target: 'invalid_value',
      });
    }).toThrowError();
  });

  it('should throw an error for invalid fields in relations', () => {
    const schema = zodSortQuery(userFields, userRelations);

    expect(() => {
      schema.parse({
        addresses: 'invalid_value',
      });
    }).toThrowError();
  });

  it('should allow partial relations and target', () => {
    const schema = zodSortQuery(userFields, userRelations);

    const parsedData = schema.parse({
      target: { id: ASC },
      addresses: { country: DESC },
    });

    expect(parsedData).toEqual({
      target: { id: ASC },
      addresses: { country: DESC },
    });
  });

  it('should fail if an empty object is not allowed', () => {
    const schema = zodSortQuery(userFields, userRelations);

    expect(() => {
      schema.parse({});
    }).toThrowError();
  });
  it('null should be valid', () => {
    expect(schema.parse(null)).toBe(null);
  });

  it('should fail if the input is not a valid object', () => {
    const schema = zodSortQuery(userFields, userRelations);

    expect(() => {
      schema.parse([]);
    }).toThrowError();
    expect(() => {
      schema.parse('invalid');
    }).toThrowError();
  });
});
