import { zodSelectFieldsInputQuerySchema } from './select';
import { z, ZodError } from 'zod';
import { ResultGetField } from '../../orm';
import { Users } from '../../../mock-utils';

describe('Check "zodSelectFieldsInputQuerySchema"', () => {
  const arrayForCheck: ResultGetField<Users>['relations'] = [
    'userGroup',
    'notes',
    'comments',
    'roles',
    'manager',
    'addresses',
  ];
  const zodSelectFieldsSchema =
    zodSelectFieldsInputQuerySchema<Users>(arrayForCheck);
  type TypeSelectField = z.infer<typeof zodSelectFieldsSchema>;
  it('Valid schema', () => {
    const check1: TypeSelectField = {
      target: 'sdfsdfsfd',
      notes: 'sdfsdf',
      comments: 'sdfsdf',
      roles: 'sdfsdf',
    };
    const check2: TypeSelectField = {
      target: 'sdfsdfsfd',
    };
    const check3: TypeSelectField = {
      addresses: 'sdfsdf',
      manager: 'sdfsdf',
    };
    const arrayCheck = [check1, check2, check3];
    for (const item of arrayCheck) {
      const result = zodSelectFieldsSchema.parse(item);
      expect(result).toEqual(item);
    }
  });
  it('Invalid schema', () => {
    const check1 = {};
    const check2 = { dfd: 'dfsdf', like: 'sdsf' };
    const check3 = null;
    const check4 = [] as any[];
    const check5 = 'ssss';

    const arrayCheck = [check1, check2, check3, check4, check5];
    expect.assertions(arrayCheck.length);
    for (const item of arrayCheck) {
      try {
        zodSelectFieldsSchema.parse(item);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });
});
