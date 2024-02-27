import { zodIdSchema, ZodIdSchema } from './id';
import { TypeField } from '../../orm';
import { ZodError } from 'zod';

describe('zodIdSchema', () => {
  let numberStringSchema: ZodIdSchema;
  let stringSchema: ZodIdSchema;
  beforeAll(() => {
    numberStringSchema = zodIdSchema(TypeField.number);
    stringSchema = zodIdSchema(TypeField.string);
  });

  it('Should be correct', () => {
    const check1 = '1';
    const check2 = '12';
    const check3 = '123';
    const check4 = '-123';

    const check5 = 'sfdsf';
    const checkArray = [check1, check2, check3, check4];
    for (const item of checkArray) {
      expect(numberStringSchema.parse(item)).toBe(item);
    }
    expect(stringSchema.parse(check5)).toBe(check5);
  });

  it('Should be not ok', () => {
    expect.assertions(1);

    try {
      numberStringSchema.parse('sdfdfsfsf');
    } catch (e) {
      expect(e).toBeInstanceOf(ZodError);
    }
  });
});
