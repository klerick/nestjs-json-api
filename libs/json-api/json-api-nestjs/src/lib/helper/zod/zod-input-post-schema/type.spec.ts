import { zodTypeSchema, ZodTypeSchema } from './type';
import { ZodError } from 'zod';

describe('type', () => {
  const literal = 'users';
  let userTypeSchema: ZodTypeSchema<typeof literal>;
  beforeAll(() => {
    userTypeSchema = zodTypeSchema(literal);
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
