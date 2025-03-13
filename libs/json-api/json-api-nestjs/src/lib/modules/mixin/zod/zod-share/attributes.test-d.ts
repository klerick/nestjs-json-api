import { expectType } from 'tsd';
import { Any } from 'ts-toolbelt';

import { Users } from '../../../../utils/___test___/test-classes.helper';
import { Attributes, IsNullableProps } from './attributes';

type CheckNotNullableArray = IsNullableProps<Users, 'id', 'testReal'>;
type CheckNullableArray = IsNullableProps<Users, 'id', 'testArrayNull'>;
type CheckNullable = IsNullableProps<Users, 'id', 'isActive'>;
type CheckNotNullable = IsNullableProps<Users, 'id', 'createdAt'>;

expectType<CheckNotNullableArray>(false);
expectType<CheckNullableArray>(true);
expectType<CheckNullable>(true);
expectType<CheckNotNullable>(false);

type CheckAttrPost = {
  testReal: number[];
  login: string;
  firstName: string;
  testArrayNull?: number[] | null | undefined;
  testDate: Date;
  createdAt: Date;
  updatedAt: Date;
  lastName?: string | null | undefined;
  isActive?: string | null | undefined;
};

type IsEqualsAttrPost = Any.Equals<Attributes<Users, 'id'>, CheckAttrPost>;
expectType<IsEqualsAttrPost>(1);

type CheckAttrPatch = {
  testReal?: number[] | undefined;
  login?: string | undefined;
  firstName?: string | undefined;
  testArrayNull?: number[] | null | undefined;
  testDate?: Date | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
  lastName?: string | null | undefined;
  isActive?: string | null | undefined;
};

type IsEqualsAttrPatch = Any.Equals<
  Attributes<Users, 'id', true>,
  CheckAttrPatch
>;
expectType<IsEqualsAttrPatch>(1);
