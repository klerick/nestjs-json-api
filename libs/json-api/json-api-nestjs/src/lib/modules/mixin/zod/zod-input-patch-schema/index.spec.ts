import {
  EntityProps,
  FieldWithType,
  PropsForField,
  RelationPrimaryColumnType,
  RelationPropsArray,
  RelationPropsTypeName,
  TypeField,
  TypeForId,
} from '../../types';
import { Users } from '../../../../mock-utils';
import { zodPatch, PatchData } from './';
import { ZodError } from 'zod';

const typeId: TypeForId = TypeField.number;
const typeName = 'Users';
const fieldWithType: FieldWithType<Users> = {
  id: TypeField.number,
  login: TypeField.string,
  firstName: TypeField.string,
  testReal: TypeField.array,
  testArrayNull: TypeField.array,
  lastName: TypeField.string,
  isActive: TypeField.boolean,
  createdAt: TypeField.date,
  testDate: TypeField.date,
  updatedAt: TypeField.date,
};
const propsDb: PropsForField<Users> = {
  id: { type: 'number', isArray: false, isNullable: false },
  login: { type: 'string', isArray: false, isNullable: false },
  firstName: { type: 'string', isArray: false, isNullable: true },
  testReal: { type: 'number', isArray: true, isNullable: false },
  testArrayNull: { type: 'number', isArray: true, isNullable: true },
  lastName: { type: 'string', isArray: false, isNullable: true },
  isActive: { type: 'boolean', isArray: false, isNullable: true },
  createdAt: { type: 'date', isArray: false, isNullable: true },
  testDate: { type: 'date', isArray: false, isNullable: true },
  updatedAt: { type: 'date', isArray: false, isNullable: true },
  notes: { type: 'string', isArray: false, isNullable: true },
  roles: { type: 'number', isArray: true, isNullable: true },
  addresses: { type: 'number', isArray: true, isNullable: true },
  userGroup: { type: 'number', isArray: false, isNullable: true },
  manager: { type: 'number', isArray: false, isNullable: true },
  comments: { type: 'number', isArray: true, isNullable: true },
};
const primaryColumn: EntityProps<Users> = 'id';
const relationArrayProps: RelationPropsArray<Users> = {
  roles: true,
  comments: true,
  notes: true,
  addresses: false,
  userGroup: false,
  manager: false,
};
const relationPopsName: RelationPropsTypeName<Users> = {
  roles: 'Roles',
  comments: 'Comments',
  notes: 'Notes',
  addresses: 'Addresses',
  userGroup: 'UserGroups',
  manager: 'Users',
};
const primaryColumnType: RelationPrimaryColumnType<Users> = {
  roles: TypeField.number,
  userGroup: TypeField.number,
  manager: TypeField.number,
  addresses: TypeField.number,
  comments: TypeField.number,
  notes: TypeField.string,
};
const schema = zodPatch(
  typeId,
  'users',
  fieldWithType,
  propsDb,
  primaryColumn,
  relationArrayProps,
  relationPopsName,
  primaryColumnType
);

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
      notes: {
        data: [
          {
            type: 'notes',
            id: 'dsfsdf',
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
