import { zodIncludeQuery } from './include';
import { usersEntityParamMapMockData } from '../../../../utils/___test___/test.helper';

const schema = zodIncludeQuery(usersEntityParamMapMockData);

describe('zodIncludeQuery', () => {
  it('should validate an array of relations successfully', () => {
    const result = schema.parse(['comments', 'addresses']);

    expect(result).toEqual(['comments', 'addresses']);
  });

  it('should return null if input is null', () => {
    const result = schema.parse(null);

    expect(result).toBeNull();
  });

  it('should throw an error if the array is empty', () => {
    expect(() => schema.parse([])).toThrowError(
      expect.objectContaining({
        message: expect.stringContaining(
          'Array must contain at least 1 element'
        ),
      })
    );
  });

  it('should throw an error if the array has duplicate entries', () => {
    expect(() => schema.parse(['addresses', 'addresses'])).toThrowError(
      expect.objectContaining({
        message: expect.stringContaining('Include should have unique relation'),
      })
    );
  });

  it('should throw an error if the input contains invalid relations', () => {
    expect(() => schema.parse(['invalid_relation'])).toThrowError(
      expect.objectContaining({
        message: expect.stringContaining('Invalid enum value. Expected'),
      })
    );
  });
});
