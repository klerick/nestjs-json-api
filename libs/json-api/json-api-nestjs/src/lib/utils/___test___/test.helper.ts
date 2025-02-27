import { kebabCase } from 'change-case-commonjs';

import { EntityParamMapService } from '../../modules/mixin/service';
import {
  Addresses,
  Comments,
  Roles,
  UserGroups,
  Users,
} from './test-classes.helper';
import { Constructor, EntityClass, EntityParam, TypeField } from '../../types';

const entityParamUsers: EntityParam<Users, 'id'> = {
  relations: ['addresses', 'manager', 'roles', 'comments', 'userGroup'],
  props: [
    'id',
    'login',
    'firstName',
    'testReal',
    'testArrayNull',
    'lastName',
    'isActive',
    'testDate',
    'createdAt',
    'updatedAt',
  ],
  className: 'Users',
  primaryColumnName: 'id',
  propsType: {
    id: TypeField.number,
    login: TypeField.string,
    firstName: TypeField.string,
    testReal: TypeField.array,
    testArrayNull: TypeField.array,
    lastName: TypeField.string,
    isActive: TypeField.null,
    testDate: TypeField.date,
    createdAt: TypeField.date,
    updatedAt: TypeField.date,
  },
  propsArrayType: {
    testReal: TypeField.number,
    testArrayNull: TypeField.number,
  },
  primaryColumnType: TypeField.number,
  propsNullable: ['testArrayNull', 'lastName', 'isActive'],
  typeName: 'users',
  relationProperty: {
    userGroup: {
      entityClass: UserGroups,
      nullable: true,
      isArray: false,
    },
    roles: {
      entityClass: Roles,
      nullable: false,
      isArray: true,
    },
    manager: {
      entityClass: Users,
      isArray: false,
      nullable: false,
    },
    comments: {
      entityClass: Comments,
      nullable: false,
      isArray: true,
    },
    addresses: {
      entityClass: Addresses,
      isArray: false,
      nullable: false,
    },
  },
};

const entityParamRoles: EntityParam<Roles, 'id'> = {
  relations: [],
  props: ['id', 'createdAt', 'updatedAt', 'name', 'key', 'isDefault'] as any,
  className: 'Roles',
  propsArrayType: {},
  primaryColumnName: 'id',
  propsType: {
    id: TypeField.number,
    name: TypeField.string,
    key: TypeField.string,
    isDefault: TypeField.boolean,
    createdAt: TypeField.date,
    updatedAt: TypeField.date,
  },
  primaryColumnType: TypeField.number,
  propsNullable: [],
  typeName: 'roles',
  relationProperty: {},
};

const entityParamAddresses: EntityParam<Addresses, 'id'> = {
  relations: [],
  props: [
    'id',
    'createdAt',
    'updatedAt',
    'city',
    'state',
    'country',
    'arrayField',
  ],
  propsArrayType: {
    arrayField: TypeField.string,
  },
  className: 'Addresses',
  primaryColumnName: 'id',
  propsType: {
    id: TypeField.number,
    city: TypeField.string,
    country: TypeField.string,
    state: TypeField.string,
    arrayField: TypeField.array,
    createdAt: TypeField.date,
    updatedAt: TypeField.date,
  },
  primaryColumnType: TypeField.number,
  propsNullable: [],
  typeName: 'addresses',
  relationProperty: {},
};

const entityParamComments: EntityParam<Comments, 'id'> = {
  relations: [],
  props: ['id', 'createdAt', 'updatedAt', 'kind'],
  propsArrayType: {},
  className: 'Comments',
  primaryColumnName: 'id',
  propsType: {
    id: TypeField.number,
    kind: TypeField.string,
    createdAt: TypeField.date,
    updatedAt: TypeField.date,
  },
  primaryColumnType: TypeField.number,
  propsNullable: [],
  typeName: 'comments',
  relationProperty: {
    user: {
      entityClass: Users,
      nullable: false,
      isArray: false,
    },
  },
};

const entityParamUserGroups: EntityParam<UserGroups, 'id'> = {
  relations: [],
  props: ['id', 'label'],
  propsArrayType: {},
  className: 'UserGroups',
  primaryColumnName: 'id',
  propsType: {
    id: TypeField.number,
    label: TypeField.string,
  },
  primaryColumnType: TypeField.number,
  propsNullable: [],
  typeName: kebabCase('UserGroups'),
  relationProperty: {},
};

export const mapMock = new Map<Constructor<any>, EntityParam<any, any>>([
  [Users, entityParamUsers],
  [Roles, entityParamRoles],
  [UserGroups, entityParamUserGroups],
  [Addresses, entityParamAddresses],
  [Comments, entityParamComments],
]);

export const usersEntityParamMapMockData = {
  entityParaMap: entityParamUsers,
  getParamMap<T extends object, IdKey extends string>(
    entity: EntityClass<T>
  ): EntityParam<T, IdKey> {
    return mapMock.get(entity) as EntityParam<T, IdKey>;
  },
} as EntityParamMapService<Users, 'id'>;

export const addressesEntityParamMapMockData = {
  entityParaMap: entityParamAddresses,
  getParamMap<T extends object, IdKey extends string>(
    entity: EntityClass<T>
  ): EntityParam<T, IdKey> {
    return mapMock.get(entity) as EntityParam<T, IdKey>;
  },
} as EntityParamMapService<Addresses, 'id'>;
