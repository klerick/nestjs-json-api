import { zodRelData, ZodRelData } from './rel-data';

import { ZodError } from 'zod';
import { TypeField } from '../../../../types';

describe('zodDataSchema', () => {
  let zodData: ZodRelData<string>;
  beforeAll(() => {
    zodData = zodRelData('users', TypeField.string);
  });

  it('Should be ok', () => {
    const check = {
      type: 'users',
      id: 'id',
    };
    expect(zodData.parse(check)).toEqual(check);
  });

  it('Should be not ok', () => {
    const check = {};
    const check1 = {
      test: '1',
    };
    const check3: any[] = [];
    const check4 = 'adfsdf';
    const check5 = true;
    const checkArray = [check, check1, check3, check4, check5];
    expect.assertions(checkArray.length);
    for (const item of checkArray) {
      try {
        zodData.parse(item);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });
});
