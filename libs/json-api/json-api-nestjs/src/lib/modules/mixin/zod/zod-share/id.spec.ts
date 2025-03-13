import { ZodError } from 'zod';

import { ZodId, zodId } from './id';
import { TypeField } from '../../../../types';

describe('zodIdSchema', () => {
  let numberStringSchema: ZodId;
  let stringSchema: ZodId;
  beforeAll(() => {
    numberStringSchema = zodId(TypeField.number);
    stringSchema = zodId(TypeField.string);
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
