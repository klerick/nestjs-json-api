import { zodPatch } from './';
import { ZodError } from 'zod';

import { usersEntityParamMapMockData } from '../../../../utils/___test___/test.helper';

const schema = zodPatch(usersEntityParamMapMockData);

describe('zodPatch', () => {
  it('should be ok', () => {
    const real = 123.123;
    const date = new Date();
    const attributes = {
      login: 'login',
      testDate: date.toISOString(),
      testReal: [`${real}`],
      testArrayNull: null,
    };
    const relationships = {
      roles: {
        data: [
          {
            type: 'roles',
            id: '1',
          },
        ],
      },
    };

    const check = {
      data: {
        id: '1',
        type: 'users',
        attributes,
        relationships,
      },
    };
    const check2 = {
      data: {
        id: '1',
        type: 'users',
        attributes,
      },
    };

    const checkResult = {
      data: {
        id: '1',
        type: 'users',
        attributes: {
          ...attributes,
          ['testDate']: date,
          testReal: [real],
        },
        relationships,
      },
    };
    const checkResult2 = {
      data: {
        id: '1',
        type: 'users',
        attributes: {
          ...attributes,
          ['testDate']: date,
          testReal: [real],
        },
      },
    };

    const checkResult3 = {
      data: {
        id: '1',
        type: 'users',
      },
    };

    expect(schema.parse(check)).toEqual(checkResult);
    expect(schema.parse(check2)).toEqual(checkResult2);
    expect(schema.parse(checkResult3)).toEqual(checkResult3);
  });

  it('should accept valid meta object', () => {
    const date = new Date();
    const attributes = {
      login: 'updated-login',
      testDate: date.toISOString(),
    };

    const checkWithMeta = {
      data: {
        id: '1',
        type: 'users',
        attributes,
      },
      meta: {
        updatedBy: 'admin',
        reason: 'data-correction',
        timestamp: Date.now(),
      },
    };

    const result = schema.parse(checkWithMeta);
    expect(result.meta).toEqual({
      updatedBy: 'admin',
      reason: 'data-correction',
      timestamp: expect.any(Number),
    });
  });

  it('should accept empty meta object', () => {
    const checkWithEmptyMeta = {
      data: {
        id: '1',
        type: 'users',
        attributes: {
          login: 'test',
        },
      },
      meta: {},
    };

    const result = schema.parse(checkWithEmptyMeta);
    expect(result.meta).toEqual({});
  });

  it('should work without meta (backward compatibility)', () => {
    const checkWithoutMeta = {
      data: {
        id: '1',
        type: 'users',
        attributes: {
          login: 'test',
        },
      },
    };

    const result = schema.parse(checkWithoutMeta);
    expect(result.meta).toBeUndefined();
  });

  it('should reject invalid meta (not an object)', () => {
    const invalidMeta = [
      { data: { id: '1', type: 'users' }, meta: 'string' },
      { data: { id: '1', type: 'users' }, meta: 123 },
      { data: { id: '1', type: 'users' }, meta: ['array'] },
      { data: { id: '1', type: 'users' }, meta: null },
    ];

    expect.assertions(invalidMeta.length);
    for (const item of invalidMeta) {
      try {
        schema.parse(item);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });

  it('should be not ok', () => {
    const check1 = {};
    const check2 = null;
    const check3: unknown[] = [];
    const check4 = '';
    const check5 = {
      sdf: 'sdf',
    };
    const check6 = {
      data: {},
    };
    const check7 = {
      data: {
        type: 'users',
      },
    };
    const check8 = {
      data: {
        type: 'users',
        attributes: {
          lastName: 'sdfsdf',
          isActive: true,
        },
        relationships: {
          notes: [
            {
              type: 'sdfsdf',
              id: 'dsfsdf',
            },
          ],
        },
      },
    };
    const check9 = {
      data: {
        type: 'users',
        attributes: {
          lastName: 'sdfsdf',
          id: 1,
        },
      },
    };
    const check10 = {
      data: {
        type: 'users',
        attributes: {
          lastName: 'sdfsdf',
        },
      },
    };
    const arrayCheck = [
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
    ];
    expect.assertions(arrayCheck.length);
    for (const item of arrayCheck) {
      try {
        schema.parse(item);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });
});
