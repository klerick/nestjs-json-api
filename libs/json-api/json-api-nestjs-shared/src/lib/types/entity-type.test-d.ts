import { expectType } from 'tsd';
import { Any } from 'ts-toolbelt';

import { Users } from '../utils/___test___/test-classes.helper';

import { RelationKeys, AttrKeys, IsIterator } from './entity-type';
import type { Collection } from '@mikro-orm/core';

type RelationId = 'addresses' | 'manager' | 'roles' | 'comments' | 'userGroup';
type RelationName = 'roles';
type PropertyId =
  | 'login'
  | 'firstName'
  | 'testReal'
  | 'testArrayNull'
  | 'lastName'
  | 'isActive'
  | 'testDate'
  | 'createdAt'
  | 'updatedAt';
type PropertyName =
  | 'id'
  | 'login'
  | 'firstName'
  | 'testReal'
  | 'testArrayNull'
  | 'lastName'
  | 'isActive'
  | 'testDate'
  | 'createdAt'
  | 'updatedAt'
  | 'addresses'
  | 'manager'
  | 'comments'
  | 'userGroup';

type IsEqualsRelationId = Any.Equals<RelationKeys<Users>, RelationId>;
type IsEqualsRelationName = Any.Equals<
  RelationKeys<Users, 'name'>,
  RelationName
>;
type IsNoEqualsRelationName = Any.Equals<
  RelationKeys<Users, 'name'>,
  'comments'
>;

type IsEqualsPropertyId = Any.Equals<AttrKeys<Users>, PropertyId>;
type IsEqualsPropertyName = Any.Equals<
  AttrKeys<Users, 'name'>,
  PropertyName
>;
type IsNoEqualsPropertyName = Any.Equals<AttrKeys<Users, 'name'>, 'roles'>;

expectType<IsEqualsRelationId>(1);
expectType<IsEqualsRelationName>(1);
expectType<IsNoEqualsRelationName>(0);

expectType<IsEqualsPropertyId>(1);
expectType<IsEqualsPropertyName>(1);
expectType<IsNoEqualsPropertyName>(0);

type ArrayUsers = Users[];
type CollectionUsers = Collection<Users>;

expectType<IsIterator<ArrayUsers>>(1);
expectType<IsIterator<CollectionUsers>>(1);
expectType<IsIterator<Users>>(0);
