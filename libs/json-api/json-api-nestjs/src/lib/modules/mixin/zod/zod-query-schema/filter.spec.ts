import { ZodError } from 'zod';

import { zodFilterQuery } from './filter';
import { usersEntityParamMapMockData } from '../../../../utils/___test___/test.helper';
import { Users } from '../../../../utils/___test___/test-classes.helper';
import { ZodFilterInputQuery } from '../zod-input-query-schema/filter';

const schema = zodFilterQuery(usersEntityParamMapMockData);

describe('Check "filter" zod schema', () => {
  describe('Valid schema', () => {
    it('Valid schema - check1', () => {
      const check1: ZodFilterInputQuery<Users, 'id'> = {
        target: {
          id: {
            gte: '1213',
            ne: '12',
          },
        },
        relation: null,
      };
      const result = schema.parse(check1);

      expect(result).toEqual({
        ...check1,
        target: {
          ...check1.target,
          id: {
            gte: 1213,
            ne: 12,
          },
        },
      });
    });

    it('Valid schema - check2', () => {
      const check2: ZodFilterInputQuery<Users, 'id'> = {
        target: {
          id: {
            gte: '1213',
          },
          login: {
            lt: 'sdfs',
          },
        },
        relation: {
          addresses: {
            arrayField: {
              some: ['sdfsdf', 'sdfsdf'],
            },
          },
        },
      };
      const result = schema.parse(check2);
      expect(result).toEqual({
        ...check2,
        target: {
          ...check2.target,
          id: {
            gte: 1213,
          }
        }
      });
    });

    it('Valid schema - check3', () => {
      const check3: ZodFilterInputQuery<Users, 'id'> = {
        target: null,
        relation: null,
      };
      const result = schema.parse(check3);
      expect(result).toEqual(check3);
    });

    it('Valid schema - check4', () => {
      const check4: ZodFilterInputQuery<Users, 'id'> = {
        target: null,
        relation: {
          comments: {
            id: {
              lte: '123',
            },
          },
          manager: {
            firstName: {
              eq: 'sdfsdfsdf',
            },
          },
        },
      };
      const result = schema.parse(check4);
      expect(result).toEqual({
        ...check4,
        relation: {
          ...check4.relation,
          comments: {
            id: {
              lte: 123,
            },
          }
        }
      });
    });

    it('Valid schema - check5', () => {
      const check5: ZodFilterInputQuery<Users, 'id'> = {
        target: null,
        relation: {
          comments: {
            id: {
              in: ['1'],
            },
          },
          manager: {
            firstName: {
              eq: 'sdfsdfsdf',
            },
          },
        },
      };
      const result = schema.parse(check5);
      expect(result).toEqual(check5);
    });

    it('Valid schema - check6', () => {
      const check6: ZodFilterInputQuery<Users, 'id'> = {
        target: {
          id: {
            gte: '1213',
            ne: '123',
          },
          addresses: {
            eq: 'null',
          },
        },
        relation: null,
      };
      const result = schema.parse(check6);
      expect(result).toEqual({
        ...check6,
        target: {
          ...check6.target,
          id:{
            gte: 1213,
            ne: 123,
          }
        },
      });
    });

    it('Valid schema - check7', () => {
      const check7: ZodFilterInputQuery<Users, 'id'> = {
        target: {
          isActive: {
            eq: 'true',
          },
        },
        relation: null,
      };
      const result = schema.parse(check7);
      expect(result).toEqual({
        ...check7,
        target: {
          ...check7.target,
        },
      });
    });

    it('Valid schema - check8', () => {
      const check8: ZodFilterInputQuery<Users, 'id'> = {
        target: {
          createdAt: {
            eq: '2023-12-08T09:40:58.020Z',
          },
        },
        relation: null,
      };
      const result = schema.parse(check8);
      expect(result).toEqual({
        ...check8,
        target: {
          ...check8.target,
          createdAt: {
            eq: new Date('2023-12-08T09:40:58.020Z'),
          },
        },
      });
    });

    it('Valid schema - check9', () => {
      const check9: ZodFilterInputQuery<Users, 'id'> = {
        target: {
          createdAt: {
            eq: 'null',
          },
        },
        relation: null,
      };
      const result = schema.parse(check9);
      expect(result.target!.createdAt!.eq).toEqual(null);
      result.target!.createdAt!.eq = 'null';
      expect(result).toEqual(check9);
    });

    it('Valid schema - check10', () => {
      const check: ZodFilterInputQuery<Users, 'id'> = {
        target: {
          id: {
            gte: '1213',
            ne: '123',
          },
          addresses: {
            eq: null as any,
          },
        },
        relation: null,
      };
      const result = schema.parse(check);
      expect(result).toEqual({
        ...check,
        target: {
          ...check.target,
          id: {
            gte: 1213,
            ne: 123,
          },
          addresses: {
            eq: 'null',
          },
        },
      });
    });
  });

  describe('Invalid schema', () => {
    it('Invalid schema - check1', () => {
      const check1 = null;
      expect(() => schema.parse(check1)).toThrow(ZodError);
    });

    it('Invalid schema - check2', () => {
      const check2 = {};
      expect(() => schema.parse(check2)).toThrow(ZodError);
    });

    it('Invalid schema - check3', () => {
      const check3 = '';
      expect(() => schema.parse(check3)).toThrow(ZodError);
    });

    it('Invalid schema - check4', () => {
      const check4 = 1;
      expect(() => schema.parse(check4)).toThrow(ZodError);
    });

    it('Invalid schema - check5', () => {
      const check5: any[] = [];
      expect(() => schema.parse(check5)).toThrow(ZodError);
    });

    it('Invalid schema - check6', () => {
      const check6 = {
        target: null,
      };
      expect(() => schema.parse(check6)).toThrow(ZodError);
    });

    it('Invalid schema - check7', () => {
      const check7 = {
        target: null,
        relation: {
          commentsasda: {
            id: {
              lte: 'sdfsdf',
            },
          },
          manager: {
            firstName: {
              eq: 'sdfsdfsdf',
            },
          },
        },
      };
      expect(() => schema.parse(check7)).toThrow(ZodError);
    });

    it('Invalid schema - check8', () => {
      const check8 = {
        target: null,
        relation: {
          comment: {
            id: {
              lte: 'sdfsdf',
            },
          },
          manager: {
            firstName: {
              eq: 'sdfsdfsdf',
            },
          },
          sdfsdf: {},
        },
      };
      expect(() => schema.parse(check8)).toThrow(ZodError);
    });
  });
});
