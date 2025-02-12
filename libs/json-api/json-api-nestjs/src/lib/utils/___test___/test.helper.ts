// @ts-nocheck
import {
  AllFieldWithType,
  FieldWithType,
  PropsForField,
  RelationPrimaryColumnType,
  RelationPropsArray,
  RelationPropsTypeName,
  RelationTree,
  ResultGetField,
  TypeField,
} from '../../modules/mixin/types';
import { Addresses, Users } from '../../mock-utils/typeorm';

export const fieldTypeUsers: FieldWithType<Users> = {
  id: TypeField.number,
  isActive: TypeField.boolean,
  firstName: TypeField.string,
  createdAt: TypeField.date,
  lastName: TypeField.string,
  login: TypeField.string,
  testDate: TypeField.date,
  updatedAt: TypeField.date,
  testReal: TypeField.array,
  testArrayNull: TypeField.array,
};
export const propsDb: PropsForField<Users> = {
  id: { type: Number, isArray: false, isNullable: false },
  login: { type: 'varchar', isArray: false, isNullable: false },
  firstName: { type: 'varchar', isArray: false, isNullable: true },
  testReal: { type: 'real', isArray: true, isNullable: false },
  testArrayNull: { type: 'real', isArray: true, isNullable: true },
  lastName: { type: 'varchar', isArray: false, isNullable: true },
  isActive: { type: 'boolean', isArray: false, isNullable: true },
  createdAt: { type: 'timestamp', isArray: false, isNullable: true },
  testDate: { type: 'timestamp', isArray: false, isNullable: true },
  updatedAt: { type: 'timestamp', isArray: false, isNullable: true },
  notes: { type: 'string', isArray: false, isNullable: true },
  roles: { type: 'number', isArray: true, isNullable: true },
  addresses: { type: 'number', isArray: true, isNullable: true },
  userGroup: { type: 'number', isArray: false, isNullable: true },
  manager: { type: 'number', isArray: false, isNullable: true },
  comments: { type: 'number', isArray: true, isNullable: true },
};
export const fieldTypeAddresses: FieldWithType<Addresses> = {
  id: TypeField.number,
  arrayField: TypeField.array,
  state: TypeField.string,
  city: TypeField.string,
  createdAt: TypeField.date,
  updatedAt: TypeField.date,
  country: TypeField.string,
};

export const relationArrayProps: RelationPropsArray<Users> = {
  roles: true,
  userGroup: false,
  notes: true,
  addresses: false,
  comments: true,
  manager: false,
};
export const relationPopsName: RelationPropsTypeName<Users> = {
  roles: 'Roles',
  userGroup: 'UserGroups',
  notes: 'Notes',
  addresses: 'Addresses',
  comments: 'Comments',
  manager: 'Users',
};

export const primaryColumnType: RelationPrimaryColumnType<Users> = {
  roles: TypeField.number,
  userGroup: TypeField.number,
  notes: TypeField.string,
  addresses: TypeField.number,
  comments: TypeField.number,
  manager: TypeField.number,
};

export const userFields: ResultGetField<Users>['field'] = [
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

export const userRelations: RelationTree<Users> = {
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

export const propsType: AllFieldWithType<Users> = {
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

export const relationList: ResultGetField<Users>['relations'] = [
  'userGroup',
  'notes',
  'comments',
  'roles',
  'manager',
  'addresses',
];

export const userFieldsStructure: ResultGetField<Users> = {
  field: [
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
  relations: [
    'userGroup',
    'notes',
    'comments',
    'roles',
    'manager',
    'addresses',
  ],
};
