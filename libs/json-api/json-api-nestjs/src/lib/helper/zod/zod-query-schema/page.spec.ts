import { zodPageQuerySchema } from './page';
import { ZodError } from 'zod';
import { DEFAULT_PAGE_SIZE, DEFAULT_QUERY_PAGE } from '../../../constants';

describe('Check "page" zod schema', () => {
  it('Valid schema', () => {
    const defaultPage = { size: DEFAULT_PAGE_SIZE, number: DEFAULT_QUERY_PAGE };
    const check1 = { size: 1, number: 1 };
    const check2 = { size: 1 };
    const check3 = undefined;
    const check4 = { number: 1 };
    const check5 = {};
    const check6 = { size: '1', number: '1' };
    const result1 = zodPageQuerySchema.parse(check1);
    const result2 = zodPageQuerySchema.parse(check2);
    const result3 = zodPageQuerySchema.parse(check3);
    const result4 = zodPageQuerySchema.parse(check4);
    const result5 = zodPageQuerySchema.parse(check5);
    const result6 = zodPageQuerySchema.parse(check6);
    expect(result1).toEqual(check1);
    expect(result2).toEqual({
      ...defaultPage,
      ...check2,
    });
    expect(result3).toEqual(defaultPage);
    expect(result4).toEqual({
      ...defaultPage,
      ...check4,
    });
    expect(result5).toEqual(defaultPage);
    expect(result6).toEqual(check1);
  });

  it('Invalid schema', () => {
    const check1 = { size: 0 };
    const check2 = { size: -1 };
    const check3 = { size: 'sdfsdf' };
    const check4 = { size: -1, number: '21ad' };
    const check5 = { size: -1, number: -1 };
    const check6 = { size: 'sdsad', number: '21ad' };
    const check7 = { size: 1, number: 2, otherProps: 'dsfsdf' };
    const check8 = { size: 1, otherProps: 'dsfsdf' };

    const checkArray = [
      check1,
      check2,
      check3,
      check4,
      check5,
      check6,
      check7,
      check8,
    ];

    expect.assertions(checkArray.length);
    for (const check of checkArray) {
      try {
        zodPageQuerySchema.parse(check1);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });
});
