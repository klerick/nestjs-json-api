import { zodFilterQuery } from './filter';
import { Users } from '../../../../mock-utils';
import {
  RelationTree,
  ResultGetField,
  AllFieldWithType,
  TypeField,
  ArrayPropsForEntity,
} from '../../types';
import { ZodError } from 'zod';
import { ZodFilterInputQuery } from '../zod-input-query-schema/filter';

const userFields: ResultGetField<Users>['field'] = [
  'updatedAt',
  'testDate',
  'createdAt',
  'isActive',
  'lastName',
  'testArrayNull',
  'testReal',
  'firstName',
  'login',
  'id',
];

const userRelations: RelationTree<Users> = {
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
    'updatedAt',
    'testDate',
    'createdAt',
    'isActive',
    'lastName',
    'testArrayNull',
    'testReal',
    'firstName',
    'login',
    'id',
  ],
  roles: ['isDefault', 'key', 'name', 'updatedAt', 'createdAt', 'id'],
  comments: ['kind', 'text', 'updatedAt', 'createdAt', 'id'],
  notes: ['text', 'updatedAt', 'createdAt', 'id'],
  userGroup: ['label', 'id'],
};

const propsArray: ArrayPropsForEntity<Users> = {
  target: {
    testArrayNull: true,
    testReal: true,
  },
  addresses: {
    arrayField: true,
  },
  userGroup: {},
  manager: {
    testArrayNull: true,
    testReal: true,
  },
  comments: {},
  notes: {},
  roles: {},
};

const propsType: AllFieldWithType<Users> = {
  updatedAt: TypeField.date,
  testDate: TypeField.date,
  createdAt: TypeField.date,
  isActive: TypeField.boolean,
  lastName: TypeField.string,
  testArrayNull: TypeField.array,
  testReal: TypeField.array,
  firstName: TypeField.string,
  login: TypeField.string,
  id: TypeField.number,
  addresses: {
    arrayField: TypeField.array,
    country: TypeField.string,
    state: TypeField.string,
    city: TypeField.string,
    updatedAt: TypeField.date,
    createdAt: TypeField.date,
    id: TypeField.number,
  },
  manager: {
    updatedAt: TypeField.date,
    testDate: TypeField.date,
    createdAt: TypeField.date,
    isActive: TypeField.boolean,
    lastName: TypeField.string,
    testArrayNull: TypeField.array,
    testReal: TypeField.array,
    firstName: TypeField.string,
    login: TypeField.string,
    id: TypeField.number,
  },
  roles: {
    isDefault: TypeField.boolean,
    key: TypeField.string,
    name: TypeField.string,
    updatedAt: TypeField.date,
    createdAt: TypeField.date,
    id: TypeField.number,
  },
  comments: {
    kind: TypeField.string,
    text: TypeField.string,
    updatedAt: TypeField.date,
    createdAt: TypeField.date,
    id: TypeField.number,
  },
  notes: {
    text: TypeField.string,
    updatedAt: TypeField.date,
    createdAt: TypeField.date,
    id: TypeField.string,
  },
  userGroup: {
    label: TypeField.string,
    id: TypeField.number,
  },
};

const schema = zodFilterQuery<Users>(
  userFields,
  userRelations,
  propsArray,
  propsType
);

describe('Check "filter" zod schema', () => {
  describe('Valid schema', () => {
    it('Valid schema - check1', () => {
      const check1: ZodFilterInputQuery<Users> = {
        target: {
          id: {
            gte: '1213',
            ne: '12',
          },
        },
        relation: null,
      };
      const result = schema.parse(check1);
      expect(result).toEqual(check1);
    });

    it('Valid schema - check2', () => {
      const check2: ZodFilterInputQuery<Users> = {
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
      expect(result).toEqual(check2);
    });

    it('Valid schema - check3', () => {
      const check3: ZodFilterInputQuery<Users> = {
        target: null,
        relation: null,
      };
      const result = schema.parse(check3);
      expect(result).toEqual(check3);
    });

    it('Valid schema - check4', () => {
      const check4: ZodFilterInputQuery<Users> = {
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
      expect(result).toEqual(check4);
    });

    it('Valid schema - check5', () => {
      const check5: ZodFilterInputQuery<Users> = {
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
      const check6: ZodFilterInputQuery<Users> = {
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
      expect(result).toEqual(check6);
    });

    it('Valid schema - check7', () => {
      const check7: ZodFilterInputQuery<Users> = {
        target: {
          isActive: {
            eq: 'true',
          },
        },
        relation: null,
      };
      const result = schema.parse(check7);
      expect(result).toEqual(check7);
    });

    it('Valid schema - check8', () => {
      const check8: ZodFilterInputQuery<Users> = {
        target: {
          createdAt: {
            eq: '2023-12-08T09:40:58.020Z',
          },
        },
        relation: null,
      };
      const result = schema.parse(check8);
      expect(result).toEqual(check8);
    });

    it('Valid schema - check9', () => {
      const check9: ZodFilterInputQuery<Users> = {
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
      const check: ZodFilterInputQuery<Users> = {
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
