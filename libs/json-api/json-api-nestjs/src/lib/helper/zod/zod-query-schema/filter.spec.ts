import { z, ZodError } from 'zod';

import { ZodFilterQuerySchema, zodFilterQuerySchema } from './filter';
import {
  AllFieldWithTpe,
  PropsArray,
  RelationTree,
  ResultGetField,
  TypeField,
} from '../../orm';
import {
  Users,
  Roles,
  UserGroups,
  Comments,
  Notes,
  Addresses,
} from '../../../mock-utils';

describe('Check "filter" zod schema', () => {
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
    'firstName',
    'login',
    'updatedAt',
    'createdAt',
    'id',
  ];

  const usersPropsArray: PropsArray<Users> = {};
  const rolesPropsArray: PropsArray<Roles> = {};
  const userGroupPropsArray: PropsArray<UserGroups> = {};
  const commentsPropsArray: PropsArray<Comments> = {};
  const notesPropsArray: PropsArray<Notes> = {};
  const addressesPropsArray: PropsArray<Addresses> = {
    arrayField: true,
  };

  const propsType: AllFieldWithTpe<Users> = {
    id: TypeField.number,
    login: TypeField.string,
    firstName: TypeField.string,
    lastName: TypeField.string,
    isActive: TypeField.boolean,
    createdAt: TypeField.date,
    testDate: TypeField.date,
    updatedAt: TypeField.date,
    addresses: {
      id: TypeField.number,
      city: TypeField.string,
      state: TypeField.string,
      country: TypeField.string,
      arrayField: TypeField.array,
      createdAt: TypeField.date,
      updatedAt: TypeField.date,
    },
    manager: {
      id: TypeField.number,
      login: TypeField.string,
      firstName: TypeField.string,
      lastName: TypeField.string,
      isActive: TypeField.boolean,
      createdAt: TypeField.date,
      testDate: TypeField.date,
      updatedAt: TypeField.date,
    },
    roles: {
      id: TypeField.number,
      name: TypeField.string,
      key: TypeField.string,
      isDefault: TypeField.boolean,
      createdAt: TypeField.date,
      updatedAt: TypeField.date,
    },
    comments: {
      id: TypeField.number,
      text: TypeField.string,
      kind: TypeField.string,
      createdAt: TypeField.date,
      updatedAt: TypeField.date,
    },
    notes: {
      id: TypeField.string,
      text: TypeField.string,
      createdAt: TypeField.date,
      updatedAt: TypeField.date,
    },
    userGroup: { id: TypeField.number, label: TypeField.string },
  };

  const filterQuerySchema = zodFilterQuerySchema<Users>(
    fields,
    relation,
    {
      target: usersPropsArray,
      roles: rolesPropsArray,
      userGroup: userGroupPropsArray,
      comments: commentsPropsArray,
      notes: notesPropsArray,
      manager: usersPropsArray,
      addresses: addressesPropsArray,
    },
    propsType
  );
  type FilterQuerySchema = z.infer<ZodFilterQuerySchema<Users>>;

  it('Valid schema', () => {
    const check1: FilterQuerySchema = {
      target: {
        id: {
          gte: '1213',
          ne: '12',
        },
      },
      relation: null,
    };
    const check2: FilterQuerySchema = {
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
    const check3: FilterQuerySchema = {
      target: null,
      relation: null,
    };
    const check4: FilterQuerySchema = {
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
    const check5: FilterQuerySchema = {
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
    const check6: FilterQuerySchema = {
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
    const check7: FilterQuerySchema = {
      target: {
        isActive: {
          eq: 'true',
        },
      },
      relation: null,
    };
    const check8: FilterQuerySchema = {
      target: {
        createdAt: {
          eq: '2023-12-08T09:40:58.020Z',
        },
      },
      relation: null,
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
    ];
    for (const check of checkArray) {
      const result = filterQuerySchema.parse(check);
      expect(result).toEqual(check);
    }
  });

  it('Invalid schema', () => {
    const check1 = null;
    const check2 = {};
    const check3 = '';
    const check4 = 1;
    const check5: any[] = [];
    const check6 = {
      target: null,
    };
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
    const check9 = {
      target: {
        id: {
          gte: '1213',
        },
        createdAt: {
          lt: 'sdfs',
        },
      },
      relation: {
        addresses: {
          arrayField: {
            eq: '1',
          },
        },
      },
    };
    const check10 = {
      target: {
        id: '',
        createdAt: {
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
    const check11 = {
      target: {
        createdAt: {
          lt1: 'sdfs',
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
    const check12 = {
      target: {
        createdAt: {
          in: 'sdfs',
        },
      },
      relation: null,
    };
    const check13 = {
      target: {
        sdfsdf: {
          eq: 'sdfs',
        },
      },
      relation: null,
    };
    const check14 = {
      target: {
        sdfsdf: {
          eq: 'sdfs',
        },
      },
      relation: {
        addresses: {
          sdfsdf: {
            eq: 'dsfsdf',
          },
        },
      },
    };
    const check15 = {
      target: null,
      relation: {
        addresses: {},
      },
    };
    const check16 = {
      target: {
        id: {
          gte: '1213',
          ne: 'sdfsfdsf',
        },
        addresses: {
          eqa: 'null',
        },
      },
      relation: null,
    };
    const check17 = {
      target: {
        id: {
          gte: '1213',
          ne: 'sdfsfdsf',
        },
        addresses: {
          eq: 'sdfsdf',
        },
      },
      relation: null,
    };
    const check18 = {
      target: {
        id: {
          gte: 'invalidType',
          ne: 'sdfsfdsf',
        },
        addresses: {
          eq: 'sdfsdf',
        },
      },
      relation: null,
    };
    const check19 = {
      target: null,
      relation: {
        comments: {
          id: {
            in: ['dsf'],
          },
        },
        manager: {
          firstName: {
            eq: 'sdfsdfsdf',
          },
        },
      },
    };
    const check20 = {
      target: {
        isActive: {
          eq: 'sdfsdf',
        },
      },
    };
    const check21: FilterQuerySchema = {
      target: {
        createdAt: {
          eq: 'sdfasd',
        },
      },
      relation: null,
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
    ];
    expect.assertions(checkArray.length);
    for (const check of checkArray) {
      try {
        filterQuerySchema.parse(check);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    }
  });
});
