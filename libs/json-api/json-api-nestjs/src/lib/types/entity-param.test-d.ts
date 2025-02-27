import { expectType, expectAssignable, expectNotAssignable } from 'tsd';
import { Any } from 'ts-toolbelt';

import {
  Addresses,
  Comments,
  Roles,
  UserGroups,
  Users,
} from '../utils/___test___/test-classes.helper';

import {
  NullableProperty,
  RelationProperty,
  EntityRelationProps,
  ArrayProperty,
  ArrayPropertyType,
  TypeField,
} from './entity-param.type';

type NullableProps = 'testArrayNull' | 'lastName' | 'isActive';

type IsEqualsNullableProps = Any.Equals<NullableProperty<Users>, NullableProps>;
type IsNoEqualsNullableProps = Any.Equals<
  NullableProperty<Users>,
  'id' | 'login'
>;
expectType<IsEqualsNullableProps>(1);
expectType<IsNoEqualsNullableProps>(0);

const checkRelationProps = {
  addresses: {
    entityClass: Addresses,
    isArray: false,
    nullable: false,
  },
  comments: {
    entityClass: Comments,
    nullable: false,
    isArray: true,
  },
  manager: {
    entityClass: Users,
    isArray: false,
    nullable: false,
  },
  roles: {
    entityClass: Roles,
    nullable: false,
    isArray: true,
  },
  userGroup: {
    entityClass: UserGroups,
    nullable: true,
    isArray: false,
  },
} satisfies RelationProperty<Users>;

const incorrectRelationProps = {
  ...checkRelationProps,
  userGroup: {
    ...checkRelationProps.userGroup,
    nullable: false,
  },
};

expectAssignable<RelationProperty<Users>>(checkRelationProps);
expectNotAssignable<RelationProperty<Users>>(incorrectRelationProps);

const checkEntityRelationProps = {
  manager: [
    'id',
    'testArrayNull',
    'lastName',
    'isActive',
    'login',
    'firstName',
    'testReal',
    'testDate',
    'createdAt',
    'updatedAt',
  ],
  roles: ['id', 'createdAt', 'updatedAt', 'name', 'key', 'isDefault'],
  comments: ['id', 'createdAt', 'updatedAt', 'kind'],
  addresses: [
    'id',
    'createdAt',
    'updatedAt',
    'city',
    'state',
    'country',
    'arrayField',
  ],
  userGroup: ['id', 'label'],
} satisfies EntityRelationProps<Users, 'id'>;

expectAssignable<EntityRelationProps<Users, 'id'>>(checkEntityRelationProps);
expectNotAssignable<EntityRelationProps<Users, 'id'>>({
  ...incorrectRelationProps,
  test: [],
});

type ArrayPropertyName = 'testReal' | 'testArrayNull';

type IsEqualsArrayProperty = Any.Equals<
  ArrayProperty<Users, 'id'>,
  ArrayPropertyName
>;
expectType<IsEqualsArrayProperty>(1);

type ArrayPropertyTypeName = {
  testReal: TypeField.number;
  testArrayNull: TypeField.number;
};

type IsEqualsArrayPropertyType = Any.Equals<
  ArrayPropertyType<Users, 'id'>,
  ArrayPropertyTypeName
>;
expectType<IsEqualsArrayPropertyType>(1);
