import { zodPageInputQuery } from './page';
import { DEFAULT_PAGE_SIZE, DEFAULT_QUERY_PAGE } from '../../../../constants';

describe('zodPageInputQuerySchema', () => {
  const schema = zodPageInputQuery();

  it('should parse valid size and number as number string', () => {
    const result = schema.parse({ size: '5', number: '2' });
    expect(result).toEqual({ size: 5, number: 2 });
  });

  it('should parse valid size and number', () => {
    const result = schema.parse({ size: 5, number: 2 });
    expect(result).toEqual({ size: 5, number: 2 });
  });

  it('should use the default size and number if not provided', () => {
    const result = schema.parse({});
    expect(result).toEqual({
      size: DEFAULT_PAGE_SIZE,
      number: DEFAULT_QUERY_PAGE,
    });
  });

  it('should fail if size is less than 1', () => {
    expect(() => schema.parse({ size: '0', number: '2' })).toThrow();
  });

  it('should fail if number is less than 1', () => {
    expect(() => schema.parse({ size: '5', number: '0' })).toThrow();
  });

  it('should error size and number is number of float', () => {
    expect(() => schema.parse({ size: '5.7', number: '2.9' })).toThrow();
  });

  it('should error if has additional properties', () => {
    expect(() =>
      schema.parse({ size: '5', number: '2', extra: 'ignored' })
    ).toThrow();
  });
});
