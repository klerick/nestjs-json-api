import { ZodError } from 'zod';
import { zodType, ZodType } from './type';

describe('type', () => {
  const literal = 'users';
  let userTypeSchema: ZodType<typeof literal>;
  beforeAll(() => {
    userTypeSchema = zodType(literal);
  });
  it('should be ok', () => {
    expect(userTypeSchema.parse(literal)).toEqual(literal);
  });
  it('should be ok', () => {
    expect.assertions(1);
    try {
      userTypeSchema.parse('test');
    } catch (e) {
      expect(e).toBeInstanceOf(ZodError);
    }
  });
});
