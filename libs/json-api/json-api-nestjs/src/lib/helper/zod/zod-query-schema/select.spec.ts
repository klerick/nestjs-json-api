import { RelationTree, ResultGetField } from '../../orm';
import { Users } from '../../../mock-utils';
import {
  ZodSelectFieldsQuerySchema,
  zodSelectFieldsQuerySchema,
} from './select';
import { z, ZodError } from 'zod';

describe('Check "select" zod schema', () => {
  const relation: RelationTree<Users> = {
    addresses: [
      'arrayField',
      'country',
      'state',
      'city',
      'updatedAt',
      'createdAt',
      'id',
    ],
    manager: [
      'testDate',
      'isActive',
      'lastName',
      'testArrayNull',
      'testReal',
      'firstName',
      'login',
      'updatedAt',
      'createdAt',
      'id',
    ],
    comments: ['kind', 'text', 'updatedAt', 'createdAt', 'id'],
    notes: ['text', 'updatedAt', 'createdAt', 'id'],
    roles: ['isDefault', 'key', 'name', 'updatedAt', 'createdAt', 'id'],
    userGroup: ['label', 'id'],
  };
  const fields: ResultGetField<Users>['field'] = [
    'testDate',
    'isActive',
    'lastName',
    'testArrayNull',
    'testReal',
    'firstName',
    'login',
    'updatedAt',
    'createdAt',
    'id',
  ];

  const selectQuerySchema = zodSelectFieldsQuerySchema(fields, relation);
  type SelectTypeQuery = z.infer<ZodSelectFieldsQuerySchema<Users>>;

  it('Valid schema', () => {
    const check1: SelectTypeQuery = {
      target: ['id', 'createdAt', 'isActive'],
      userGroup: ['label'],
      roles: ['createdAt'],
    };
    const check2: SelectTypeQuery = {
      userGroup: ['label'],
      roles: ['createdAt'],
    };
    const check3: SelectTypeQuery = {
      addresses: ['city'],
    };
    const checkArray = [check1, check2, check3];
    for (const check of checkArray) {
      const result = selectQuerySchema.parse(check);
      expect(result).toEqual(check);
    }
  });

  it('Invalid schema', () => {
    const check1 = {};
    const check2 = null;
    const check3 = '';
    const check4: [] = [];
    const check5 = {
      target: ['id', 'createdAt', 'isActive'],
      userGroup1: ['label'],
      roles: ['createdAt', 'createdAt'],
    };
    const check6 = {
      target1: ['id', 'createdAt', 'isActive'],
      userGroup: ['label'],
      roles: ['createdAt', 'createdAt'],
    };
    const check7 = {
      target: ['id1', 'createdAt', 'isActive'],
      userGroup: ['label'],
    };
    const check8 = {
      target: ['id1', 'createdAt', 'isActive'],
      userGroup: ['label'],
      roles: ['createdAt1', 'createdAt'],
    };
    const check9 = {
      target: '',
      userGroup: ['label'],
    };
    const check10 = {
      target: {},
      userGroup: ['label'],
    };
    const check11 = {
      target: [],
      userGroup: ['label'],
    };
    const check12 = {
      target: '',
      userGroup: ['label'],
    };
    const check13 = {
      target: null,
      userGroup: ['label'],
    };
    const checkArray = [
      check1,
      check2,
      check3,
      check4,
      check5,
      check6,
      check7,
      check8,
      check9,
      check10,
      check11,
      check12,
      check13,
    ];
    expect.assertions(checkArray.length);
    for (const check of checkArray) {
      try {
        selectQuerySchema.parse(check);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });
});
