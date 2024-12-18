import { z, ZodError } from 'zod';

import { zodSortQuerySchema, ZodSortQuerySchema } from './sort';
import { RelationTree, ResultGetField } from '../../orm';
import { Users } from '../../../mock-utils';

describe('Check "sort" zod schema', () => {
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

  const sortQuerySchema = zodSortQuerySchema(fields, relation);
  type SortTypeQuery = z.infer<ZodSortQuerySchema<Users>>;
  it('Valid schema', () => {
    const check1: SortTypeQuery = {
      target: {
        id: 'DESC',
        createdAt: 'ASC',
      },
    };
    const check2: SortTypeQuery = {
      comments: {
        kind: 'ASC',
        createdAt: 'ASC',
      },
      roles: {
        id: 'ASC',
      },
    };
    const checkArray = [check1, check2];
    for (const check of checkArray) {
      const result = sortQuerySchema.parse(check);
      expect(result).toEqual(check);
    }
  });
  it('Invalid schema', () => {
    const check1 = '';
    const check2 = null;
    const check3: string[] = ['test'];
    const check4: string[] = ['addresses', 'manager', 'manager'];
    const check5 = {};
    const check6 = {
      sdfsf: null,
    };
    const check7 = {
      sdfsf: null,
      sfdsdf: null,
    };

    const check8 = {
      comments: {},
    };
    const check9 = {
      comments: null,
    };
    const check10 = {
      comments: 's',
    };
    const check11 = {
      comments: [],
    };
    const check12 = {
      comments: {
        kindsdfsdf: 'ASC',
      },
    };
    const check13 = {
      comments: {
        kind: '',
      },
    };
    const check14 = {
      comments: {
        kind: 'sdfsdf',
      },
    };
    const check15 = {
      comments: {
        kind: [],
      },
    };
    const check16 = {
      comments: {
        kind: {},
      },
    };
    const check17 = {
      target: {},
    };
    const check18 = {
      target: null,
    };
    const check19 = {
      target: 's',
    };
    const check20 = {
      target: [],
    };
    const check21 = {
      target: {
        idsdfsdf: 'ASC',
      },
    };
    const check22 = {
      target: {
        id: '',
      },
    };
    const check23 = {
      target: {
        id: 'sdfsdf',
      },
    };
    const check24 = {
      target: {
        id: [],
      },
    };
    const check25 = {
      target: {
        id: {},
      },
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
      check14,
      check15,
      check16,
      check17,
      check18,
      check19,
      check20,
      check21,
      check22,
      check23,
      check24,
      check25,
    ];
    expect.assertions(checkArray.length);
    for (const check of checkArray) {
      try {
        sortQuerySchema.parse(check);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });
});
