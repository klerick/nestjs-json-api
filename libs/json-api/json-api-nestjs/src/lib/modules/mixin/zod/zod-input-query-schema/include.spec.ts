import { zodIncludeInputQuery } from './include';

describe('zodIncludeInputQuerySchema', () => {
  const schema = zodIncludeInputQuery();

  it('should return null when input is undefined', () => {
    const result = schema.parse(undefined);
    expect(result).toBeNull();
  });

  it('should return null when input is number, null, boolean, array', () => {
    expect(() => schema.parse(123 as any)).toThrow();
    expect(() => schema.parse(null as any)).toThrow();
    expect(() => schema.parse(false as any)).toThrow();
    expect(() => schema.parse([] as any)).toThrow();
  });

  it('should split a comma-separated string into an array of trimmed values', () => {
    const result = schema.parse('a, b  ,c , d');
    expect(result).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should filter out empty values from the resulting array', () => {
    const result = schema.parse('a, , b,  , c');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should return null for an empty string', () => {
    const result = schema.parse('');
    expect(result).toBeNull();
  });
});
