import { zodSortQuery } from './sort';

import { ASC, DESC } from '../../../../constants';

import { usersEntityParamMapMockData } from '../../../../utils/___test___/test.helper';

const schema = zodSortQuery(usersEntityParamMapMockData);
describe('zodSortQuery', () => {
  it('should create a Zod schema with target and relations', () => {
    const parsedData = schema.parse({
      target: { id: ASC },
      addresses: { country: DESC },
      manager: { lastName: ASC },
      roles: { name: DESC },
      comments: { kind: DESC },
      userGroup: { label: ASC },
    });

    expect(parsedData).toEqual({
      target: { id: ASC },
      addresses: { country: DESC },
      manager: { lastName: ASC },
      roles: { name: DESC },
      comments: { kind: DESC },
      userGroup: { label: ASC },
    });
  });

  it('should throw an error for an invalid field in target', () => {
    const schema = zodSortQuery(usersEntityParamMapMockData);

    expect(() => {
      schema.parse({
        target: 'invalid_value',
      });
    }).toThrowError();
  });

  it('should throw an error for invalid fields in relations', () => {
    const schema = zodSortQuery(usersEntityParamMapMockData);

    expect(() => {
      schema.parse({
        addresses: 'invalid_value',
      });
    }).toThrowError();
  });

  it('should allow partial relations and target', () => {
    const schema = zodSortQuery(usersEntityParamMapMockData);

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
    const schema = zodSortQuery(usersEntityParamMapMockData);

    expect(() => {
      schema.parse({});
    }).toThrowError();
  });
  it('null should be valid', () => {
    expect(schema.parse(null)).toBe(null);
  });

  it('should fail if the input is not a valid object', () => {
    const schema = zodSortQuery(usersEntityParamMapMockData);

    expect(() => {
      schema.parse([]);
    }).toThrowError();
    expect(() => {
      schema.parse('invalid');
    }).toThrowError();
  });
});
