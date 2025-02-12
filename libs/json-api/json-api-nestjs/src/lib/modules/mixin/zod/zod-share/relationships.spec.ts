import { z, ZodError } from 'zod';

import { zodRelationships, ZodRelationships } from './relationships';
import { Users } from '../../../../mock-utils/typeorm';

import {
  relationArrayProps,
  relationPopsName,
  primaryColumnType,
} from '../../../../utils/___test___/test.helper';

describe('zodRelationships', () => {
  let relationshipsSchema: ZodRelationships<Users>;

  describe('POST', () => {
    beforeAll(() => {
      relationshipsSchema = zodRelationships(
        relationArrayProps,
        relationPopsName,
        primaryColumnType,
        false
      );
    });

    it('Should be ok', () => {
      const check = {
        comments: {
          data: [
            {
              type: 'comments',
              id: '1',
            },
          ],
        },
        userGroup: {
          data: {
            type: 'user-groups',
            id: '1',
          },
        },
        manager: {
          data: {
            type: 'users',
            id: '1',
          },
        },
        notes: {
          data: [
            {
              type: 'notes',
              id: 'id',
            },
          ],
        },
      };
      expect(relationshipsSchema.parse(check)).toEqual(check);
    });

    it('should be not ok', () => {
      const check1 = {};
      const check2 = '';
      const check3: any[] = [];
      const check4 = true;
      const check5 = {
        sddsf: {},
      };
      const check6 = {
        comments: [],
      };
      const check7 = {
        comments: {},
      };
      const check8 = {
        comments: '',
      };
      const check9 = {
        comments: true,
      };
      const check10 = {
        comments: [
          {
            sdsf: 'sdfsdf',
          },
        ],
      };
      const check11 = {
        comments: [{}],
      };
      const check12 = {
        manager: {},
      };
      const check13 = {
        manager: {
          sdfs: 'sdsdf',
        },
      };
      const check14 = {
        manager: {
          id: 'sdsdf',
          type: 'users',
        },
      };
      const check15 = {
        manager: null,
      };
      const check16 = {
        manager: [],
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
        check11,
        check12,
        check13,
        check14,
        check15,
        check16,
      ];
      expect.assertions(arrayCheck.length);
      for (const item of arrayCheck) {
        try {
          relationshipsSchema.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });

  describe('PATCH', () => {
    beforeAll(() => {
      relationshipsSchema = zodRelationships(
        relationArrayProps,
        relationPopsName,
        primaryColumnType,
        true
      );
    });

    it('Should be ok', () => {
      const check = {
        comments: {
          data: [],
        },
        userGroup: {
          data: null,
        },
        manager: {
          data: {
            type: 'users',
            id: '1',
          },
        },
        notes: {
          data: [
            {
              type: 'notes',
              id: 'id',
            },
          ],
        },
      };
      expect(relationshipsSchema.parse(check)).toEqual(check);
    });

    it('should be not ok', () => {
      const check1 = {};
      const check2 = '';
      const check3: any[] = [];
      const check4 = true;
      const check5 = {
        sddsf: {},
      };
      const check6 = {
        comments: [],
      };
      const check7 = {
        comments: {},
      };
      const check8 = {
        comments: '',
      };
      const check9 = {
        comments: true,
      };
      const check10 = {
        comments: [
          {
            sdsf: 'sdfsdf',
          },
        ],
      };
      const check11 = {
        comments: [{}],
      };
      const check12 = {
        manager: {},
      };
      const check13 = {
        manager: {
          sdfs: 'sdsdf',
        },
      };
      const check14 = {
        manager: {
          id: 'sdsdf',
          type: 'users',
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
        check11,
        check12,
        check13,
        check14,
      ];
      expect.assertions(arrayCheck.length);
      for (const item of arrayCheck) {
        try {
          relationshipsSchema.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });
});
