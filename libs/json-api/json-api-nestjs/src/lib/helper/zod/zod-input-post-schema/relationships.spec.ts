import { z, ZodError } from 'zod';

import {
  zodRelationshipsSchema,
  ZodRelationshipsSchema,
} from './relationships';
import { Users } from '../../../mock-utils';
import {
  RelationPropsType,
  RelationPropsTypeName,
  RelationPrimaryColumnType,
  TypeField,
} from '../../orm';

describe('zodRelationshipsSchema', () => {
  const relationArrayProps: RelationPropsType<Users> = {
    roles: true,
    userGroup: false,
    notes: true,
    addresses: false,
    comments: true,
    manager: false,
  };
  const relationPopsName: RelationPropsTypeName<Users> = {
    roles: 'Roles',
    userGroup: 'UserGroups',
    notes: 'Notes',
    addresses: 'Addresses',
    comments: 'Comments',
    manager: 'Users',
  };

  const primaryColumnType: RelationPrimaryColumnType<Users> = {
    roles: TypeField.number,
    userGroup: TypeField.number,
    notes: TypeField.string,
    addresses: TypeField.number,
    comments: TypeField.number,
    manager: TypeField.number,
  };

  let relationshipsSchema: ZodRelationshipsSchema<Users>;
  beforeAll(() => {
    relationshipsSchema = zodRelationshipsSchema(
      relationArrayProps,
      relationPopsName,
      primaryColumnType
    );
  });

  it('Should be ok', () => {
    const check = {
      comments: [
        {
          type: 'comments',
          id: '1',
        },
      ],
      userGroup: {
        type: 'user-groups',
        id: '1',
      },
      manager: {
        type: 'users',
        id: '1',
      },
      notes: [
        {
          type: 'notes',
          id: 'id',
        },
      ],
    };
    const check2 = {
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
    expect(relationshipsSchema.parse(check2)).toEqual(check);
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
