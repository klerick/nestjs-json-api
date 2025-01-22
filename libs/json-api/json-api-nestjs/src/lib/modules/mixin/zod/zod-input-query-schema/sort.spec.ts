import { zodSortInputQuery } from './sort';
import { ASC, DESC } from '../../../../constants';

describe('zodSortInputQuerySchema', () => {
  const schema = zodSortInputQuery();

  it('should transform a single field sort to the correct format', () => {
    const result = schema.parse('name');
    expect(result).toEqual({ target: { name: ASC } });
  });

  it('should transform a descending field sort to the correct format', () => {
    const result = schema.parse('-name');
    expect(result).toEqual({ target: { name: DESC } });
  });

  it('should transform multiple fields sort to the correct format', () => {
    const result = schema.parse('name,-age');
    expect(result).toEqual({ target: { name: ASC, age: DESC } });
  });

  it('should handle nested fields sort properly', () => {
    const result = schema.parse('user.name,-user.age');
    expect(result).toEqual({
      user: { name: ASC, age: DESC },
    });
  });

  it('should ignore empty or invalid inputs between commas', () => {
    const result = schema.parse('name,,,-age');
    expect(result).toEqual({ target: { name: ASC, age: DESC } });
  });

  it('should return null for empty input', () => {
    const result = schema.parse('');
    expect(result).toBeNull();
  });

  it('should trim spaces and process input correctly', () => {
    const result = schema.parse('  name  ,  -age  ');
    expect(result).toEqual({ target: { name: ASC, age: DESC } });
  });

  it('should handle a mix of nested and non-nested fields', () => {
    const result = schema.parse('user.name,-age,user.email');
    expect(result).toEqual({
      user: { name: ASC, email: ASC },
      target: { age: DESC },
    });
  });

  it('should return null if the input is undefined', () => {
    const result = schema.parse(undefined);
    expect(result).toBeNull();
  });
});
