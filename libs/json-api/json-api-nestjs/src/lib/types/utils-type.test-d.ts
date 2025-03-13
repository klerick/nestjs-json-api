import { Collection } from '@mikro-orm/core';
import { expectType } from 'tsd';
import { Any, Object, Tuple, Union } from 'ts-toolbelt';

import { HasId, UnionToTuple, CastIteratorType } from './utils-type';
import { Users } from '../utils/___test___/test-classes.helper';

type UnionForTuple =
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
  | 'userGroup'
  | 'roles';
type TupleCheck = UnionToTuple<Object.RequiredKeys<Users>>;
type IsEqualsFromTupleToUnion = Any.Equals<
  Tuple.UnionOf<TupleCheck>,
  UnionForTuple
>;

expectType<IsEqualsFromTupleToUnion>(1);
expectType<HasId<Users, 'id'>>(1);
expectType<HasId<Users, 'inccorect'>>(0);

type ArrayUsers = Users[];
type CollectionUsers = Collection<Users>;

type IsEqualsArrayUsers = Any.Equals<CastIteratorType<ArrayUsers>, Users>;
type IsEqualsCollectionUsers = Any.Equals<
  CastIteratorType<CollectionUsers>,
  Users
>;
type IsEqualsUsers = Any.Equals<CastIteratorType<Users>, Users>;

expectType<IsEqualsArrayUsers>(1);
expectType<IsEqualsCollectionUsers>(1);
expectType<IsEqualsUsers>(1);
