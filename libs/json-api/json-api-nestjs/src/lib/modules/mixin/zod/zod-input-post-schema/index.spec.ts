import { ZodError } from 'zod';
import { zodPost } from './';
import { usersEntityParamMapMockData } from '../../../../utils/___test___/test.helper';

const schema = zodPost(usersEntityParamMapMockData);

describe('zodPost', () => {
  it('should be ok', () => {
    const real = 123.123;
    const date = new Date();
    const attributes = {
      login: 'login',
      lastName: 'sdfsdf',
      firstName: 'sdds',
      isActive: 'null',
      testDate: date.toISOString(),
      createdAt: date.toISOString() as any,
      updatedAt: date.toISOString() as any,
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
      addresses: {
        data: {
          type: 'addresses',
          id: '1',
        },
      },
      manager: {
        data: {
          type: 'users',
          id: '1',
        },
      },
    };
    const check = {
      data: {
        type: 'users',
        attributes,
        relationships,
      },
    };
    const check2 = {
      data: {
        type: 'users',
        attributes,
      },
    };
    const check3 = {
      data: {
        id: '1',
        type: 'users',
        attributes,
      },
    };

    const checkResult = {
      data: {
        type: 'users',
        attributes: {
          ...attributes,
          ['testDate']: date,
          createdAt: date,
          updatedAt: date,
          testReal: [real],
        },
        relationships,
      },
    };
    const checkResult2 = {
      data: {
        type: 'users',
        attributes: {
          ...attributes,
          ['testDate']: date,
          createdAt: date,
          updatedAt: date,
          testReal: [real],
        },
      },
    };
    const checkResult3 = {
      data: {
        id: '1',
        type: 'users',
        attributes: {
          ...attributes,
          ['testDate']: date,
          createdAt: date,
          updatedAt: date,
          testReal: [real],
        },
      },
    };

    expect(schema.parse(check)).toEqual(checkResult);
    expect(schema.parse(check2)).toEqual(checkResult2);
    expect(schema.parse(check3)).toEqual(checkResult3);
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
