import { zodFilterInputQuery } from './filter';
import { usersEntityParamMapMockData } from '../../../../utils/___test___/test.helper';

describe('zodFilterInputQuery', () => {
  it('should return transformed result with relation and target when valid data is provided', () => {
    const schema = zodFilterInputQuery(usersEntityParamMapMockData);
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
    const schema = zodFilterInputQuery(usersEntityParamMapMockData);

    const result = schema.parse({});
    expect(result).toEqual({ relation: null, target: null });
  });

  it('should ignore invalid fields and not include them in the result', () => {
    const schema = zodFilterInputQuery(usersEntityParamMapMockData);
    const input = {
      invalidField: { eq: 'should be ignored' },
      login: { eq: 'johndoe', gte: '123' },
    };

    const result = schema.parse(input);

    expect(result).toEqual({
      relation: null,
      target: { login: { eq: 'johndoe', gte: '123' } },
    });
  });

  it('should handle nested relations correctly', () => {
    const schema = zodFilterInputQuery(usersEntityParamMapMockData);
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
    const schema = zodFilterInputQuery(usersEntityParamMapMockData);

    const invalidInput = {
      login: { unknownOperator: 'invalid' },
    };

    expect(() => schema.parse(invalidInput)).toThrow();
  });
});
